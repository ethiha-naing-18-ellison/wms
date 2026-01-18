// backend/src/routes/inventoryValuation.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/inventoryValuation.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Inventory valuation summary
router.get(
  "/valuation/summary",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.getTotalInventoryValuation
);

// Inventory valuation by category (product group)
router.get(
  "/valuation/categories",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.getInventoryValuationByCategory
);

// Inventory valuation by product (optional)
router.get(
  "/valuation/products",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.getInventoryValuationByProduct
);

module.exports = router;
