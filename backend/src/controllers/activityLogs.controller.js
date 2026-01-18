const pool = require("../config/db");

/**
 * GET /api/activity-logs
 * Roles: admin, manager
 */
exports.getActivityLogs = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      al.log_id,
      al.action,
      al.entity,
      al.entity_id,
      al.created_at,
      u.email,
      u.role
    FROM activity_logs al
    LEFT JOIN users u ON u.user_id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT 100
  `);

  res.json(rows);
};
