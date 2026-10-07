const express = require("express");
const controller = require("../controllers/purchaseController");
const router = express.Router();

router.get("/", controller.listPurchases);
router.post("/", controller.createPurchase);
router.get("/:id", controller.getPurchase);
router.put("/:id", controller.updatePurchase);
// Intentionally no DELETE route: purchases are historical records.

module.exports = router;
