const pool = require("../config/db");

// ==========================
// GET suppliers
// ==========================
// controllers/suppliers.controller.js
exports.getSuppliers = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        supplier_id,
        name,
        contact_person,
        phone,
        email,
        address,
        status,
        created_at
      FROM suppliers
      WHERE status = 'active'
      ORDER BY name
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET suppliers error:", err.message);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
};


// ==========================
// CREATE supplier
// ==========================
exports.createSupplier = async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;

  if (!name || !contact_person) {
    return res.status(400).json({ error: "Name and contact_person are required" });
  }

  const { rows } = await pool.query(`
    INSERT INTO suppliers
      (name, contact_person, phone, email, address, status)
    VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING *
  `, [name, contact_person, phone, email, address]);

  res.status(201).json(rows[0]);
};

