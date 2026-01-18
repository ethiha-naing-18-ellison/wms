const pool = require("../config/db");

/**
 * POST /api/outbound/:id/attachments
 * Roles: admin, manager
 */
exports.uploadOutboundAttachment = async (req, res) => {
  const { id: outbound_id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { originalname, filename, mimetype } = req.file;

  try {
    // Ensure outbound exists
    const check = await pool.query(
      `SELECT outbound_id FROM outbound_records WHERE outbound_id = $1`,
      [outbound_id]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: "Outbound record not found" });
    }

    await pool.query(
      `
      INSERT INTO outbound_attachments
        (outbound_id, file_name, file_path, mime_type)
      VALUES ($1, $2, $3, $4)
      `,
      [
        outbound_id,
        originalname,
        `/uploads/outbound/${filename}`,
        mimetype,
      ]
    );

    res.status(201).json({
      message: "Attachment uploaded successfully",
    });
  } catch (err) {
    console.error("Outbound attachment error:", err.message);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
};
