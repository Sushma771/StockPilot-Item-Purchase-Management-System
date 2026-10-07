const express = require("express");
const controller = require("../controllers/itemController");
const router = express.Router();

router.get("/stats", controller.dashboardStats);
router.get("/", controller.listItems);
router.post("/", controller.createItem);
router.get("/:id", controller.getItem);
router.put("/:id", controller.updateItem);
router.patch("/:id/toggle", controller.toggleItem);
router.delete("/:id", controller.deleteItem);

module.exports = router;
