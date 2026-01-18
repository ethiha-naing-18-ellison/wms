// backend/src/controllers/inventoryValuation.controller.js
const pool = require("../config/db");

/**
 * GET /api/inventory/valuation/summary
 * Total inventory valuation (all products)
 */
exports.getTotalInventoryValuation = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(i.quantity * i.avg_cost), 0) AS total_value
      FROM inventory i
    `);

    res.json({
      total_value: Number(rows[0].total_value),
    });
  } catch (err) {
    console.error("Valuation summary error:", err.message);
    res.status(500).json({ error: "Failed to calculate inventory valuation" });
  }
};

/**
 * GET /api/inventory/valuation/categories
 * Inventory valuation grouped by product category
 */
exports.getInventoryValuationByCategory = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.category,
        SUM(i.quantity * i.avg_cost) AS total_value
      FROM inventory i
      JOIN products p ON p.product_id = i.product_id
      GROUP BY p.category
      ORDER BY total_value DESC
    `);

    res.json(
      rows.map(r => ({
        category: r.category || "Uncategorized",
        total_value: Number(r.total_value),
      }))
    );
  } catch (err) {
    console.error("Valuation by category error:", err.message);
    res.status(500).json({ error: "Failed to calculate category valuation" });
  }
};

/**
 * GET /api/inventory/valuation/products
 * Inventory valuation per product (optional but useful)
 */
exports.getInventoryValuationByProduct = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.product_id,
        p.sku,
        p.name,
        p.category,
        i.quantity,
        i.avg_cost,
        (i.quantity * i.avg_cost) AS total_value
      FROM inventory i
      JOIN products p ON p.product_id = i.product_id
      ORDER BY total_value DESC
    `);

    res.json(
      rows.map(r => ({
        product_id: r.product_id,
        sku: r.sku,
        name: r.name,
        category: r.category,
        quantity: r.quantity,
        avg_cost: Number(r.avg_cost),
        total_value: Number(r.total_value),
      }))
    );
  } catch (err) {
    console.error("Valuation by product error:", err.message);
    res.status(500).json({ error: "Failed to calculate product valuation" });
  }
};
