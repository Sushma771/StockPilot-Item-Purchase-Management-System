const express = require("express");
const controller = require("../controllers/itemTypeController");
const router = express.Router();

router.get("/", controller.listItemTypes);
router.post("/", controller.createItemType);
router.put("/:id", controller.updateItemType);
router.delete("/:id", controller.deleteItemType);

module.exports = router;
