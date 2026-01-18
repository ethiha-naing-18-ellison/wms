const pool = require("../config/db");
const { logActivity } = require("../services/activityLogger");
const bwipjs = require("bwip-js");

/**
 * GET /api/products
 */
exports.getAllProducts = async (req, res) => {
  const { q, sku, category, tag } = req.query;

  const conditions = [`status = 'active'`];
  const values = [];
  let idx = 1;

  if (q) {
    conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }

  if (sku) {
    conditions.push(`sku ILIKE $${idx}`);
    values.push(`%${sku}%`);
    idx++;
  }

  if (category) {
    conditions.push(`category ILIKE $${idx}`);
    values.push(`%${category}%`);
    idx++;
  }

  if (tag) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM unnest(tags) t
        WHERE t ILIKE $${idx}
      )
    `);
    values.push(`%${tag}%`);
    idx++;
  }

  const { rows } = await pool.query(
    `
    SELECT
      product_id,
      sku,
      name,
      description,
      category,
      tags,
      low_stock_threshold,
      created_at,
      updated_at
    FROM products
    WHERE ${conditions.join(" AND ")}
    ORDER BY name
    `,
    values
  );

  res.json(rows);
};

/**
 * POST /api/products
 */
exports.createProduct = async (req, res) => {
  const { sku, name, category, description, tags, low_stock_threshold } = req.body;
  const client = await pool.connect();

  let productId;

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      INSERT INTO products
        (sku, name, category, description, tags, low_stock_threshold, status)
      VALUES ($1,$2,$3,$4,$5,$6,'active')
      RETURNING product_id
      `,
      [sku, name, category, description, tags || [], low_stock_threshold]
    );

    productId = rows[0].product_id;

    await client.query(
      `INSERT INTO inventory (product_id, quantity) VALUES ($1, 0)`,
      [productId]
    );

    await client.query("COMMIT");

    // ✅ LOG AFTER COMMIT
    await logActivity({
      userId: req.user.userId,
      action: "CREATE",
      entity: "product",
      entityId: productId,
    });

    res.status(201).json({ message: "Product created" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, description, tags, low_stock_threshold } = req.body;

  const { rows } = await pool.query(
    `
    UPDATE products
    SET
      name = $1,
      category = $2,
      description = $3,
      tags = $4,
      low_stock_threshold = $5,
      updated_at = NOW()
    WHERE product_id = $6
      AND status = 'active'
    RETURNING *
    `,
    [
      name,
      category,
      description,
      Array.isArray(tags) ? tags : [],
      low_stock_threshold,
      id,
    ]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Product not found or archived" });
  }

  await logActivity({
    userId: req.user.userId,
    action: "UPDATE",
    entity: "product",
    entityId: id,
  });

  res.json(rows[0]);
};

/**
 * PATCH /api/products/:id/archive
 */
exports.archiveProduct = async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query(
    `
    UPDATE products
    SET status = 'archived', updated_at = NOW()
    WHERE product_id = $1 AND status = 'active'
    `,
    [id]
  );

  if (!rowCount) {
    return res.status(404).json({ message: "Product not found or already archived" });
  }

  await logActivity({
    userId: req.user.userId,
    action: "ARCHIVE",
    entity: "product",
    entityId: id,
  });

  res.json({ message: "Product archived" });
};

/**
 * DELETE /api/products/:id
 * (Logical delete → archive)
 */
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  await pool.query(
    `
    UPDATE products
    SET status = 'archived', updated_at = NOW()
    WHERE product_id = $1
    `,
    [id]
  );

  await logActivity({
    userId: req.user.userId,
    action: "ARCHIVE",
    entity: "product",
    entityId: id,
  });

  res.json({ message: "Product deleted (archived)" });
};

/**
 * GET /api/products/meta
 */
exports.getProductMeta = async (req, res) => {
  const categoriesRes = await pool.query(`
    SELECT DISTINCT category
    FROM products
    WHERE status = 'active'
      AND category IS NOT NULL
      AND category <> ''
    ORDER BY category
  `);

  const tagsRes = await pool.query(`
    SELECT DISTINCT t AS tag
    FROM products p, unnest(p.tags) t
    WHERE p.status = 'active'
    ORDER BY t
  `);

  res.json({
    categories: categoriesRes.rows.map(r => r.category),
    tags: tagsRes.rows.map(r => r.tag),
  });
};

/**
 * GET /api/products/:id/qr
 * Generate QR code for product SKU
 * Roles: admin, manager, operator
 */
const QRCode = require("qrcode");

exports.getProductQr = async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    `
    SELECT product_id, sku, name
    FROM products
    WHERE product_id = $1
      AND status = 'active'
    `,
    [id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Product not found" });
  }

  const product = rows[0];

  // QR payload — keep it simple & standard
  const qrPayload = `SKU:${product.sku}`;

  try {
    const qrImage = await QRCode.toDataURL(qrPayload);

    res.json({
      product_id: product.product_id,
      sku: product.sku,
      name: product.name,
      qr: qrImage, // base64 PNG
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};

// ✅ Exact SKU lookup for scanner workflows
// GET /api/products/lookup?sku=SKU-123
exports.lookupBySku = async (req, res) => {
  const { sku } = req.query;

  if (!sku || !sku.trim()) {
    return res.status(400).json({ message: "sku is required" });
  }

  const { rows } = await pool.query(
    `
    SELECT
      product_id,
      sku,
      name,
      category,
      tags,
      low_stock_threshold
    FROM products
    WHERE status = 'active'
      AND sku = $1
    LIMIT 1
    `,
    [sku.trim()]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Product not found for this SKU" });
  }

  res.json(rows[0]);
};

// ✅ Barcode generator (Code128)
// GET /api/products/:id/barcode
exports.getProductBarcode = async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    `
    SELECT product_id, sku, name
    FROM products
    WHERE product_id = $1
    LIMIT 1
    `,
    [id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Product not found" });
  }

  const { sku, name, product_id } = rows[0];

  try {
    // Generate barcode PNG
    const png = await bwipjs.toBuffer({
      bcid: "code128",      // Barcode type
      text: sku,            // Encode SKU
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: "center",
    });

    // Return as base64 data URL (frontend-friendly)
    const base64 = `data:image/png;base64,${png.toString("base64")}`;

    // optional: log this as READ (if you want)
    // await logActivity({ userId: req.user.userId, action:"READ", entity:"BARCODE", entityId: product_id });

    res.json({
      product_id,
      sku,
      name,
      barcode: base64,
    });
  } catch (err) {
    console.error("Barcode error:", err);
    res.status(500).json({ message: "Failed to generate barcode" });
  }
};
