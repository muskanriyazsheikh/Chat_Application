// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { searchUsers, getUserById, getAllUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAllUsers);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserById);

module.exports = router;
