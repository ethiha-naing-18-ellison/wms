const express = require("express");
const router = express.Router();
const multer = require("multer");

const controller = require("../controllers/outboundDocuments.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

const upload = multer({ dest: "uploads/outbound/" });

router.get(
  "/:id/documents",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.listOutboundDocuments
);

router.post(
  "/:id/documents",
  requireAuth,
  requireRole(["admin", "manager"]),
  upload.single("file"),
  controller.uploadOutboundDocument
);

module.exports = router;
