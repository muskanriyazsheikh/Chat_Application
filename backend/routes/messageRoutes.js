// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { getMessages, uploadFile, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

// Use memory storage for Cloudinary streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed"), false);
  },
});

router.get("/:roomId", protect, getMessages);
router.post("/upload", protect, upload.single("file"), uploadFile);
router.delete("/:messageId", protect, deleteMessage);

module.exports = router;
