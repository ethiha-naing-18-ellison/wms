const express = require("express");
const router = express.Router();
const multer = require("multer");

const controller = require("../controllers/bulkOutbound.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

const upload = multer({ dest: "uploads/" });

router.post(
  "/outbound",
  requireAuth,
  requireRole(["admin", "manager"]),
  upload.single("file"),
  controller.bulkOutboundUpload
);

module.exports = router;
