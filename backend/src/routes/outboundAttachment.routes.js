const express = require("express");
const router = express.Router();

const upload = require("../middlewares/outboundUpload");
const controller = require("../controllers/outboundAttachment.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Upload attachment
router.post(
  "/:id/attachments",
  requireAuth,
  requireRole(["admin", "manager"]),
  upload.single("file"),
  controller.uploadOutboundAttachment
);

module.exports = router;
