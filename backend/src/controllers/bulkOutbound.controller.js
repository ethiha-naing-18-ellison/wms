// backend/src/controllers/bulkOutbound.controller.js
const fs = require("fs");
const csv = require("csv-parser");
const pool = require("../config/db");
const { applyInventoryMovement } = require("../services/inventory.service");

/**
 * POST /api/bulk/outbound
 * Roles: admin, manager
 * CSV columns:
 * customer_name,product_id,quantity,so_reference,dispatch_date
 */
exports.bulkOutboundUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  const rows = [];

  try {
    // 1) Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => rows.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    if (!rows.length) {
      return res.status(400).json({ error: "CSV is empty" });
    }

    const userId = req.user.userId;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let processed = 0;

      for (const r of rows) {
        const customer_name = (r.customer_name || "").trim();
        const product_id = (r.product_id || "").trim();
        const quantity = Number(r.quantity);
        const so_reference = (r.so_reference || "").trim() || null;
        const dispatch_date = (r.dispatch_date || "").trim();

        if (!customer_name || !product_id || !dispatch_date || !quantity || quantity <= 0) {
          throw new Error("Invalid CSV row: missing/invalid required fields");
        }

        // 1️⃣ Create outbound header
        const headerRes = await client.query(
          `
          INSERT INTO outbound_records
            (customer_name, so_reference, dispatch_date, created_by)
          VALUES ($1,$2,$3,$4)
          RETURNING outbound_id
          `,
          [customer_name, so_reference, dispatch_date, userId]
        );

        const outboundId = headerRes.rows[0].outbound_id;

        // 2️⃣ Lock inventory row
        const invRes = await client.query(
          `SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE`,
          [product_id]
        );

        if (invRes.rowCount === 0) {
          throw new Error("Inventory record not found");
        }

        if (invRes.rows[0].quantity < quantity) {
          throw new Error("Insufficient stock");
        }

        // 3️⃣ Insert outbound item
        await client.query(
          `
          INSERT INTO outbound_items (outbound_id, product_id, quantity)
          VALUES ($1,$2,$3)
          `,
          [outboundId, product_id, quantity]
        );

        // 4️⃣ ✅ CENTRALIZED inventory movement
        await applyInventoryMovement({
          productId: product_id,
          quantity,
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
          [product_id, -quantity, outboundId]
        );

        processed++;
      }

      await client.query("COMMIT");
      res.json({ message: "Bulk outbound upload successful", processed });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Bulk outbound error:", err.message);
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("CSV read error:", err.message);
    res.status(500).json({ error: "Failed to process CSV" });
  } finally {
    fs.unlink(filePath, () => {});
  }
};
