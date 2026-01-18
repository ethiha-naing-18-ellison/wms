const express = require("express");
const router = express.Router();

const controller = require("../controllers/inbound.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Create inbound (Admin, Manager)
router.post(
  "/",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.createInbound
);

// View inbound history (Admin, Manager)
router.get(
  "/",
  requireAuth,
  requireRole(["admin", "manager","operator"]),
  controller.getInboundHistory
);

module.exports = router;
