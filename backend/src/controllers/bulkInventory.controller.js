const pool = require("../config/db");
const { parse } = require("csv-parse/sync");
const XLSX = require("xlsx");

function parseFile(file) {
  // Accept CSV by mimetype OR file extension (Windows-safe)
if (
  file.mimetype === "text/csv" ||
  file.mimetype === "application/vnd.ms-excel" ||
  file.originalname.endsWith(".csv")
) {
  return parse(file.buffer.toString(), {
    columns: true,
    skip_empty_lines: true,
  });
}


  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    const wb = XLSX.read(file.buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  }

  throw new Error("Unsupported file type");
}

exports.bulkUploadInventory = async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const records = parseFile(req.file);

    await client.query("BEGIN");

    for (const r of records) {
      const tags = r.tags ? r.tags.split("|") : [];

      // Check existing product
      const existing = await client.query(
        `SELECT product_id, status FROM products WHERE sku = $1`,
        [r.sku]
      );

      let productId;

      if (existing.rowCount > 0) {
        if (existing.rows[0].status === "active") {
          throw new Error(`SKU already exists: ${r.sku}`);
        }

        // Reactivate archived product
        productId = existing.rows[0].product_id;

        await client.query(
          `
          UPDATE products
          SET name=$1, category=$2, description=$3, tags=$4,
              low_stock_threshold=$5, status='active', updated_at=NOW()
          WHERE product_id=$6
          `,
          [
            r.name,
            r.category,
            r.description,
            tags,
            r.low_stock_threshold,
            productId,
          ]
        );
      } else {
        // Create product
        const { rows } = await client.query(
          `
          INSERT INTO products
            (sku, name, category, description, tags, low_stock_threshold, status)
          VALUES ($1,$2,$3,$4,$5,$6,'active')
          RETURNING product_id
          `,
          [
            r.sku,
            r.name,
            r.category,
            r.description,
            tags,
            r.low_stock_threshold,
          ]
        );

        productId = rows[0].product_id;

        // Init inventory
        await client.query(
          `INSERT INTO inventory (product_id, quantity) VALUES ($1, 0)`,
          [productId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Bulk inventory upload successful" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};
