const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const controller = require("../controllers/bulkInbound.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  requireAuth,
  requireRole(["admin", "manager"]),
  upload.single("file"),
  controller.bulkInboundUpload
);

module.exports = router;
