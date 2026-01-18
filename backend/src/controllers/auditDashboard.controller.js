// auditDashboard.controller.js
const pool = require("../config/db");

/**
 * GET /api/audit/summary
 * Admin / Manager only
 */
exports.getAuditSummary = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) AS total_actions,
      COUNT(*) FILTER (WHERE entity = 'inbound') AS inbound_actions,
      COUNT(*) FILTER (WHERE entity = 'outbound') AS outbound_actions,
      COUNT(DISTINCT al.user_id) AS active_users
    FROM activity_logs al
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

  res.json(rows[0]);
};

/**
 * GET /api/audit/top-users
 */
exports.getTopUsers = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      u.email,
      u.role,
      COUNT(*) AS action_count
    FROM activity_logs al
    JOIN users u ON u.id = al.user_id
    GROUP BY u.email, u.role
    ORDER BY action_count DESC
    LIMIT 10
  `);

  res.json(rows);
};

/**
 * GET /api/audit/top-products
 */
exports.getTopEditedProducts = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      p.product_id,
      p.sku,
      p.name,
      COUNT(*) AS edit_count
    FROM inventory_audit ia
    JOIN products p ON p.product_id = ia.product_id
    GROUP BY p.product_id, p.sku, p.name
    ORDER BY edit_count DESC
    LIMIT 10
  `);

  res.json(rows);
};

/**
 * GET /api/audit/high-movement
 */
exports.getHighStockMovement = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      p.product_id,
      p.sku,
      p.name,
      SUM(ABS(ia.quantity_change)) AS total_movement
    FROM inventory_audit ia
    JOIN products p ON p.product_id = ia.product_id
    GROUP BY p.product_id, p.sku, p.name
    ORDER BY total_movement DESC
    LIMIT 10
  `);

  res.json(rows);
};
