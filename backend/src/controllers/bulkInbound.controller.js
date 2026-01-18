// backend/src/controllers/bulkInbound.controller.js
const pool = require("../config/db");
const csv = require("csv-parser");
const fs = require("fs");
const { applyInventoryMovement } = require("../services/inventory.service");

/**
 * POST /api/bulk/inbound
 * Roles: admin, manager
 */
exports.bulkInboundUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file is required" });
  }

  const userId = req.user.userId;
  const rows = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        for (const r of rows) {
          const {
            supplier_id,
            product_id,
            quantity,
            unit_cost,
            reference_no,
            received_date,
          } = r;

          // ✅ VALIDATION FIRST (CRITICAL)
          if (!supplier_id || !product_id || !quantity || !received_date) {
            throw new Error("Invalid CSV row: missing required fields");
          }

          if (unit_cost === undefined || Number(unit_cost) < 0) {
            throw new Error("unit_cost is required and must be >= 0");
          }

          // 1️⃣ Create inbound receipt
          const { rows: ir } = await client.query(
            `
            INSERT INTO inbound_receipts
              (supplier_id, reference_no, received_date, created_by)
            VALUES ($1,$2,$3,$4)
            RETURNING inbound_id
            `,
            [
              supplier_id,
              reference_no || null,
              received_date,
              userId,
            ]
          );

          const inboundId = ir[0].inbound_id;

          // 2️⃣ Insert inbound item (WITH unit_cost)
          await client.query(
            `
            INSERT INTO inbound_items
              (inbound_id, product_id, quantity, unit_cost)
            VALUES ($1,$2,$3,$4)
            `,
            [
              inboundId,
              product_id,
              Number(quantity),
              Number(unit_cost),
            ]
          );

          // 3️⃣ Inventory movement (SINGLE SOURCE OF TRUTH)
          await applyInventoryMovement({
            productId: product_id,
            quantity: Number(quantity),
            unitCost: Number(unit_cost),
            type: "INBOUND",
            userId,
            client,
          });

          // 4️⃣ Inventory audit log
          await client.query(
            `
            INSERT INTO inventory_audit
              (product_id, change_type, quantity_change, reference_id)
            VALUES ($1,'INBOUND',$2,$3)
            `,
            [product_id, Number(quantity), inboundId]
          );
        }

        await client.query("COMMIT");

        res.json({
          message: "Bulk inbound upload successful",
          processed: rows.length,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Bulk inbound error:", err.message);
        res.status(400).json({ error: err.message });
      } finally {
        client.release();
        fs.unlinkSync(req.file.path);
      }
    });
};
