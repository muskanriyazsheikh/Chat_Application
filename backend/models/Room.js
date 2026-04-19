// models/Room.js - Chat room schema (supports DMs and group chats)
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    // For group chats; DMs use participant usernames as name
    name: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      default: "",
      maxlength: 200,
    },
    // "dm" = direct message, "group" = group chat
    type: {
      type: String,
      enum: ["dm", "group"],
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Admin(s) for group chats
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    avatar: {
      type: String,
      default: "",
    },
    // Reference to the last message for sidebar preview
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
