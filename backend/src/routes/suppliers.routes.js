// backend/routes/suppliers.routes.js
const express = require("express");
const router = express.Router();

const controller = require("../controllers/suppliers.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// ==========================
// GET suppliers (ALL ROLES)
// ==========================
router.get(
  "/",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getSuppliers
);

// ==========================
// CREATE supplier (ADMIN)
// ==========================
router.post(
  "/",
  requireAuth,
  requireRole(["admin"]),
  controller.createSupplier
);

module.exports = router;
