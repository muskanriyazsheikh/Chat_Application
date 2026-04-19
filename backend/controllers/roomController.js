// controllers/roomController.js - Chat room operations
const Room = require("../models/Room");
const Message = require("../models/Message");

// @desc    Get all rooms for the current user
// @route   GET /api/rooms
// @access  Private
const getUserRooms = async (req, res) => {
  const rooms = await Room.find({ participants: req.user._id })
    .populate("participants", "username avatar isOnline lastSeen")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username" },
    })
    .sort({ updatedAt: -1 });

  res.json({ success: true, rooms });
};

// @desc    Get or create a DM room between two users
// @route   POST /api/rooms/dm
// @access  Private
const getOrCreateDM = async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user._id;

  if (!recipientId) {
    return res.status(400).json({ success: false, message: "Recipient ID required." });
  }

  // Check if DM already exists
  let room = await Room.findOne({
    type: "dm",
    participants: { $all: [senderId, recipientId], $size: 2 },
  })
    .populate("participants", "username avatar isOnline lastSeen")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username" },
    });

  if (!room) {
    room = await Room.create({
      type: "dm",
      participants: [senderId, recipientId],
    });
    room = await room.populate("participants", "username avatar isOnline lastSeen");
  }

  res.json({ success: true, room });
};

// @desc    Create a group chat room
// @route   POST /api/rooms/group
// @access  Private
const createGroupRoom = async (req, res) => {
  const { name, participantIds, description } = req.body;

  if (!name || !participantIds || participantIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Group name and at least 2 other participants are required.",
    });
  }

  const allParticipants = [req.user._id, ...participantIds];

  const room = await Room.create({
    name,
    description: description || "",
    type: "group",
    participants: allParticipants,
    admins: [req.user._id],
  });

  const populated = await room.populate("participants", "username avatar isOnline lastSeen");

  res.status(201).json({ success: true, room: populated });
};

// @desc    Get a single room by ID
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res) => {
  const room = await Room.findOne({
    _id: req.params.id,
    participants: req.user._id,
  }).populate("participants", "username avatar isOnline lastSeen");

  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found." });
  }

  res.json({ success: true, room });
};

// @desc    Update last message reference in room (called internally)
const updateRoomLastMessage = async (roomId, messageId) => {
  await Room.findByIdAndUpdate(roomId, { lastMessage: messageId });
};

module.exports = { getUserRooms, getOrCreateDM, createGroupRoom, getRoomById, updateRoomLastMessage };
