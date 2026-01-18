const router = require("express").Router();
const upload = require("../middlewares/upload.middleware");
const controller = require("../controllers/bulkInventory.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/inventory",
  requireAuth,
  requireRole(["admin", "manager"]),
  upload.single("file"),
  controller.bulkUploadInventory
);

module.exports = router;
