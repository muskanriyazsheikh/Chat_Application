// routes/roomRoutes.js
const express = require("express");
const router = express.Router();
const { getUserRooms, getOrCreateDM, createGroupRoom, getRoomById } = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getUserRooms);
router.post("/dm", protect, getOrCreateDM);
router.post("/group", protect, createGroupRoom);
router.get("/:id", protect, getRoomById);

module.exports = router;
