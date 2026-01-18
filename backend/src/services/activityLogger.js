const pool = require("../config/db");

/**
 * Write user activity logs
 * Matches activity_logs table exactly
 */
async function logActivity({ userId, action, entity, entityId }) {
  await pool.query(
    `
    INSERT INTO activity_logs
      (user_id, action, entity, entity_id)
    VALUES ($1, $2, $3, $4)
    `,
    [userId || null, action, entity, entityId || null]
  );
}

module.exports = { logActivity };
