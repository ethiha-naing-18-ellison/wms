// auditDashboard.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/auditDashboard.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Admin / Manager only
router.get(
  "/summary",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.getAuditSummary
);

router.get(
  "/top-users",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.getTopUsers
);

router.get(
  "/top-products",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.getTopEditedProducts
);

router.get(
  "/high-movement",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.getHighStockMovement
);

module.exports = router;
