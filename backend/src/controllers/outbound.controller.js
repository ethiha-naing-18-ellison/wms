// backend/src/controllers/outbound.controller.js
const pool = require("../config/db");
const { logActivity } = require("../services/activityLogger");
const { applyInventoryMovement } = require("../services/inventory.service");


/**
 * POST /api/outbound
 * Roles: admin, manager
 */
exports.createOutbound = async (req, res) => {
  const { customer_name, so_reference, dispatch_date, items } = req.body;
  const userId = req.user.userId;

  if (!customer_name || !dispatch_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid outbound payload" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Create outbound header
    const { rows } = await client.query(
      `
      INSERT INTO outbound_records
        (customer_name, so_reference, dispatch_date, created_by)
      VALUES ($1,$2,$3,$4)
      RETURNING outbound_id
      `,
      [customer_name, so_reference || null, dispatch_date, userId]
    );

    const outboundId = rows[0].outbound_id;

    // 2️⃣ Process each item
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid outbound item");
      }

      // 🔒 Lock inventory row
      const invRes = await client.query(
        `
        SELECT quantity
        FROM inventory
        WHERE product_id = $1
        FOR UPDATE
        `,
        [item.product_id]
      );

      if (invRes.rowCount === 0) {
        throw new Error("Inventory record not found");
      }

      if (invRes.rows[0].quantity < item.quantity) {
        throw new Error("Insufficient stock");
      }

      // 3️⃣ Insert outbound item
      await client.query(
        `
        INSERT INTO outbound_items (outbound_id, product_id, quantity)
        VALUES ($1,$2,$3)
        `,
        [outboundId, item.product_id, item.quantity]
      );

      // 4️⃣ Deduct inventory
      await applyInventoryMovement({
  productId: item.product_id,
  quantity: item.quantity,
  type: "OUTBOUND",
  userId,
  client,
});


      // 5️⃣ Audit log
      await client.query(
        `
        INSERT INTO inventory_audit
          (product_id, change_type, quantity_change, reference_id)
        VALUES ($1,'OUTBOUND',$2,$3)
        `,
        [item.product_id, -item.quantity, outboundId]
      );
    }

    await client.query("COMMIT");

    await logActivity({
  userId,
  action: "CREATE",
  entity: "outbound",
  entityId: outboundId,
});


    res.status(201).json({
      message: "Outbound recorded successfully",
      outbound_id: outboundId,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

/**
 * GET /api/outbound
 * Roles: admin, manager (operator optional later)
 */
exports.getOutboundHistory = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        o.outbound_id,
        o.customer_name,
        o.so_reference,
        o.dispatch_date,
        COUNT(oi.outbound_item_id)::int AS total_items,
        COALESCE(SUM(oi.quantity), 0)::int AS total_quantity,
        o.created_at
      FROM outbound_records o
      LEFT JOIN outbound_items oi ON oi.outbound_id = o.outbound_id
      GROUP BY o.outbound_id
      ORDER BY o.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET outbound error:", err.message);
    res.status(500).json({ error: "Failed to load outbound history" });
  }
};
