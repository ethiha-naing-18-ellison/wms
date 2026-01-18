const express = require("express");
const router = express.Router();

const controller = require("../controllers/products.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// View products (ALL roles)
router.get(
  "/",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getAllProducts
);

// Create product (Admin, Manager)
router.post(
  "/",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.createProduct
);

// Update product (Admin, Manager)
router.put(
  "/:id",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.updateProduct
);
router.patch(
  "/:id/archive",
  requireAuth,
  requireRole(["admin", "manager"]),
  controller.archiveProduct
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(["admin"]),
  controller.deleteProduct
);

router.get(
  "/meta",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getProductMeta
);

// QR code for product (ALL roles)
router.get(
  "/:id/qr",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getProductQr
);

// ✅ Scanner lookup (ALL roles)
router.get(
  "/lookup",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.lookupBySku
);

// ✅ Barcode image (ALL roles)
router.get(
  "/:id/barcode",
  requireAuth,
  requireRole(["admin", "manager", "operator"]),
  controller.getProductBarcode
);


module.exports = router;
