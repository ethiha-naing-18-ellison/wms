/// backend/src/controllers/inbound.controller.js
const pool = require("../config/db");
const { logActivity } = require("../services/activityLogger");
const { applyInventoryMovement } = require("../services/inventory.service");


/**
 * POST /api/inbound
 * Roles: admin, manager
 */
exports.createInbound = async (req, res) => {
  const { supplier_id, reference_no, received_date, items } = req.body;
  const userId = req.user.userId;

  if (!supplier_id || !received_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid inbound payload" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create inbound receipt
    const { rows } = await client.query(
      `
      INSERT INTO inbound_receipts
        (supplier_id, reference_no, received_date, created_by)
      VALUES ($1,$2,$3,$4)
      RETURNING inbound_id
      `,
      [supplier_id, reference_no || null, received_date, userId]
    );

    const inboundId = rows[0].inbound_id;

    // 2. Insert items + update inventory + audit
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid inbound item");
      }

      if (item.unit_cost === undefined || item.unit_cost < 0) {
  throw new Error("unit_cost is required for inbound items");
}

await client.query(
  `
  INSERT INTO inbound_items (inbound_id, product_id, quantity, unit_cost)
  VALUES ($1,$2,$3,$4)
  `,
  [inboundId, item.product_id, item.quantity, item.unit_cost]
);
await applyInventoryMovement({
  productId: item.product_id,
  quantity: item.quantity,
  unitCost: item.unit_cost,
  type: "INBOUND",
  userId,
  client,
});


      await client.query(
        `
        INSERT INTO inventory_audit
          (product_id, change_type, quantity_change, reference_id)
        VALUES ($1,'INBOUND',$2,$3)
        `,
        [item.product_id, item.quantity, inboundId]
      );
    }

    await client.query("COMMIT");
    await logActivity({
  userId,
  action: "CREATE",
  entity: "inbound",
  entityId: inboundId,
});

    res.status(201).json({
      message: "Inbound recorded successfully",
      inbound_id: inboundId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Inbound error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

/**
 * GET /api/inbound
 * Roles: admin, manager
 */
exports.getInboundHistory = async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT
      ir.inbound_id,
      s.name AS supplier_name,
      ir.reference_no,
      ir.received_date,
      COUNT(ii.inbound_item_id) AS total_items,
      SUM(ii.quantity) AS total_quantity,
      ir.created_at
    FROM inbound_receipts ir
    LEFT JOIN suppliers s ON s.supplier_id = ir.supplier_id
    LEFT JOIN inbound_items ii ON ii.inbound_id = ir.inbound_id
    GROUP BY ir.inbound_id, s.name
    ORDER BY ir.created_at DESC
    `
  );

  res.json(rows);
};
