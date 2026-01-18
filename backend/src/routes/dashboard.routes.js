const express = require("express");
const router = express.Router();

const controller = require("../controllers/dashboard.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

router.get(
  "/summary",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getDashboardSummary
);

module.exports = router;
