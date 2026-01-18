const express = require("express");
const router = express.Router();

const controller = require("../controllers/outbound.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");



// View outbound history (Admin, Manager)
router.get(
  "/",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getOutboundHistory
);

// Create outbound (Admin, Manager)
router.post(
  "/",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.createOutbound
);

module.exports = router;
