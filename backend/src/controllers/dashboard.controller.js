// backend/src/controllers/dashboard.controller.js
const pool = require("../config/db");

exports.getDashboardSummary = async (req, res) => {
  try {
    const { start_date, end_date, product_id } = req.query;

    const start =
      start_date || new Date(Date.now() - 7 * 86400000).toISOString();
    const end = end_date || new Date().toISOString();

    /* =====================
       1️⃣ STATS
    ===================== */

    const totalInventoryRes = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0)::int AS total
      FROM inventory
    `);

    const inboundTodayRes = await pool.query(
      `
      SELECT COALESCE(SUM(ii.quantity), 0)::int AS total
      FROM inbound_items ii
      JOIN inbound_receipts ir ON ir.inbound_id = ii.inbound_id
      WHERE ir.received_date = CURRENT_DATE
      ${product_id ? "AND ii.product_id = $1" : ""}
      `,
      product_id ? [product_id] : []
    );

    const outboundTodayRes = await pool.query(
      `
      SELECT COALESCE(SUM(oi.quantity), 0)::int AS total
      FROM outbound_items oi
      JOIN outbound_records o ON o.outbound_id = oi.outbound_id
      WHERE o.dispatch_date = CURRENT_DATE
      ${product_id ? "AND oi.product_id = $1" : ""}
      `,
      product_id ? [product_id] : []
    );

    const lowStockRes = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM inventory i
      JOIN products p ON p.product_id = i.product_id
      WHERE i.quantity <= p.low_stock_threshold
    `);

    /* =====================
       2️⃣ RECENT ACTIVITY
    ===================== */

    const activityRes = await pool.query(
      `
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
      WHERE al.created_at BETWEEN $1 AND $2
      ORDER BY al.created_at DESC
      LIMIT 10
      `,
      [start, end]
    );

    /* =====================
       3️⃣ DAILY VOLUME
    ===================== */

    const volumeRes = await pool.query(
      `
      SELECT
        d::date AS date,
        COALESCE(SUM(in_qty), 0)::int AS inbound,
        COALESCE(SUM(out_qty), 0)::int AS outbound
      FROM generate_series($1::date, $2::date, interval '1 day') d
      LEFT JOIN (
        SELECT
          ir.received_date AS date,
          SUM(ii.quantity) AS in_qty,
          0 AS out_qty
        FROM inbound_items ii
        JOIN inbound_receipts ir ON ir.inbound_id = ii.inbound_id
        ${product_id ? "WHERE ii.product_id = $3" : ""}
        GROUP BY ir.received_date
        UNION ALL
        SELECT
          o.dispatch_date AS date,
          0 AS in_qty,
          SUM(oi.quantity) AS out_qty
        FROM outbound_items oi
        JOIN outbound_records o ON o.outbound_id = oi.outbound_id
        ${product_id ? "WHERE oi.product_id = $3" : ""}
        GROUP BY o.dispatch_date
      ) x ON x.date = d::date
      GROUP BY d
      ORDER BY d
      `,
      product_id ? [start, end, product_id] : [start, end]
    );

    res.json({
      stats: {
        total_inventory_items: totalInventoryRes.rows[0].total,
        inbound_today: inboundTodayRes.rows[0].total,
        outbound_today: outboundTodayRes.rows[0].total,
        low_stock_alerts: lowStockRes.rows[0].total,
      },
      recent_activity: activityRes.rows,
      daily_volume: volumeRes.rows,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err.message);
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
};
