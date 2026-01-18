const pool = require("../config/db");

exports.uploadOutboundDocument = async (req, res) => {
  const { id } = req.params;

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const { originalname, path, mimetype } = req.file;

    const { rows } = await pool.query(
      `
      INSERT INTO outbound_attachments (outbound_id, file_name, file_path, mime_type)
      VALUES ($1,$2,$3,$4)
      RETURNING attachment_id, file_name, file_path, mime_type, uploaded_at
      `,
      [id, originalname, path, mimetype || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Upload outbound doc error:", err.message);
    res.status(500).json({ error: "Failed to upload document" });
  }
};

exports.listOutboundDocuments = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT attachment_id, file_name, file_path, mime_type, uploaded_at
      FROM outbound_attachments
      WHERE outbound_id = $1
      ORDER BY uploaded_at DESC
      `,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("List outbound doc error:", err.message);
    res.status(500).json({ error: "Failed to load documents" });
  }
};
