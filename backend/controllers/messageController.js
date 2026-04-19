// controllers/messageController.js - Message operations
const Message = require("../models/Message");
const Room = require("../models/Room");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc    Get messages for a room (paginated)
// @route   GET /api/messages/:roomId?page=1&limit=50
// @access  Private
const getMessages = async (req, res) => {
  const { roomId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Ensure user is in the room
  const room = await Room.findOne({ _id: roomId, participants: req.user._id });
  if (!room) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  const messages = await Message.find({ room: roomId, deleted: false })
    .populate("sender", "username avatar")
    .sort({ createdAt: -1 }) // newest first
    .skip(skip)
    .limit(limit);

  // Return in chronological order
  res.json({ success: true, messages: messages.reverse(), page });
};

// @desc    Upload a file/image and get URL
// @route   POST /api/messages/upload
// @access  Private
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file provided." });
  }

  const isImage = req.file.mimetype.startsWith("image/");
  const folder = isImage ? "chat_images" : "chat_files";
  const resourceType = isImage ? "image" : "raw";

  // Upload to Cloudinary via stream
  const uploadFromBuffer = () =>
    new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

  const result = await uploadFromBuffer();

  res.json({
    success: true,
    url: result.secure_url,
    type: isImage ? "image" : "file",
    fileName: req.file.originalname,
  });
};

// @desc    Delete a message (soft delete)
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.messageId);

  if (!message) {
    return res.status(404).json({ success: false, message: "Message not found." });
  }

  // Only sender can delete their own message
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized." });
  }

  message.deleted = true;
  message.content = "This message was deleted.";
  await message.save();

  res.json({ success: true, message: "Message deleted." });
};

module.exports = { getMessages, uploadFile, deleteMessage };
