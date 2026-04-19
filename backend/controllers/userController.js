// controllers/userController.js - User-related operations
const User = require("../models/User");

// @desc    Search users by username or email
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ success: true, users: [] });
  }

  const regex = new RegExp(q.trim(), "i");

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user._id } }, // Exclude self
      { $or: [{ username: regex }, { email: regex }] },
    ],
  })
    .select("username email avatar isOnline lastSeen bio")
    .limit(20);

  res.json({ success: true, users });
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "username email avatar isOnline lastSeen bio"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  res.json({ success: true, user });
};

// @desc    Get all users (for contacts list)
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select("username email avatar isOnline lastSeen bio")
    .sort({ isOnline: -1, username: 1 })
    .limit(50);

  res.json({ success: true, users });
};

module.exports = { searchUsers, getUserById, getAllUsers };
