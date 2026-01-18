// inventory.controller.js
const pool = require("../config/db");

/**
 * GET /api/inventory
 * Roles: admin, manager, operator
 */
exports.getInventory = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      i.inventory_id,
      p.product_id,
      p.sku,
      p.name,
      p.category,
      i.quantity,
      i.avg_cost,
      (i.quantity * i.avg_cost) AS total_value,
      i.updated_at
    FROM inventory i
    JOIN products p ON p.product_id = i.product_id
    WHERE p.status = 'active'
    ORDER BY p.name
  `);

  res.json(rows);
};

exports.getLowStockItems = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      p.product_id,
      p.sku,
      p.name,
      p.category,
      i.quantity,
      p.low_stock_threshold
    FROM inventory i
    JOIN products p ON p.product_id = i.product_id
    WHERE p.status = 'active'
      AND i.quantity <= p.low_stock_threshold
    ORDER BY i.quantity ASC
  `);

  res.json(rows);
};

/**
 * GET /api/inventory/audit
 * Roles: admin, manager
 */
exports.getInventoryAudit = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      ia.audit_id,
      p.sku,
      p.name,
      ia.change_type,
      ia.quantity_change,
      ia.reference_id,
      ia.created_at
    FROM inventory_audit ia
    JOIN products p ON p.product_id = ia.product_id
    ORDER BY ia.created_at DESC
  `);

  res.json(rows);
};
