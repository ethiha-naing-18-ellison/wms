const express = require("express");
const router = express.Router();

const controller = require("../controllers/inventory.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");
const { getInventoryAudit } = require("../controllers/inventory.controller");


router.get(
  "/",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getInventory
);

router.get(
  "/audit",
  requireAuth,
  requireRole(["admin", "manager"]),
  getInventoryAudit
);

router.get(
  "/low-stock",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getLowStockItems
);

module.exports = router;


