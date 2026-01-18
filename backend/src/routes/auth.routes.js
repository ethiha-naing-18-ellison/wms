const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.post("/login", controller.login);
router.get("/me", requireAuth, controller.me);

module.exports = router;
