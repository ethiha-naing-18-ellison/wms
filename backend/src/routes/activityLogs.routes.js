const express = require("express");
const router = express.Router();

const controller = require("../controllers/activityLogs.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Admin & Manager only
router.get(
  "/",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getActivityLogs
);

module.exports = router;
