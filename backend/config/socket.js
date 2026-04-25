const Message = require("../models/Message");
const User = require("../models/User");
 
const onlineUsers = new Map(); // userId -> socketId
 
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
 
    // ── Online presence ───────────────────────────────────────
    socket.on("user:online", async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
 
    // ── Room management ───────────────────────────────────────
    socket.on("room:join",  (roomId) => socket.join(roomId));
    socket.on("room:leave", (roomId) => socket.leave(roomId));
 
    // ── Messaging ─────────────────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const { roomId, senderId, content, type = "text", fileUrl, fileName } = data;
        const message = await Message.create({
          room: roomId, sender: senderId, content, type,
          fileUrl: fileUrl || null, fileName: fileName || null,
          readBy: [senderId],
        });
        const populated = await message.populate("sender", "username avatar");
        io.to(roomId).emit("message:receive", populated);
 
        // Update room's lastMessage
        const Room = require("../models/Room");
        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });
      } catch (err) {
        console.error("message:send error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
 
    // ── Typing indicators ─────────────────────────────────────
    socket.on("typing:start", ({ roomId, username }) => socket.to(roomId).emit("typing:start", { username }));
    socket.on("typing:stop",  ({ roomId }) => socket.to(roomId).emit("typing:stop"));
 
    // ── Read receipts ─────────────────────────────────────────
    socket.on("messages:read", async ({ roomId, userId }) => {
      try {
        await Message.updateMany(
          { room: roomId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        io.to(roomId).emit("messages:read", { roomId, userId });
      } catch (err) { console.error("messages:read error:", err); }
    });
 
    // ── Message reactions ─────────────────────────────────────
    socket.on("message:react", async ({ messageId, roomId, userId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
 
        // Toggle reaction
        const existingIdx = message.reactions?.findIndex(
          (r) => r.userId.toString() === userId && r.emoji === emoji
        );
        if (existingIdx > -1) {
          message.reactions.splice(existingIdx, 1);
        } else {
          if (!message.reactions) message.reactions = [];
          message.reactions.push({ userId, emoji });
        }
        await message.save();
        io.to(roomId).emit("message:reaction", { messageId, emoji, userId });
      } catch (err) { console.error("message:react error:", err); }
    });
 
    // ════════════════════════════════════════════════════════
    // WEBRTC CALL SIGNALING
    // ════════════════════════════════════════════════════════
 
    // ── Initiate call ─────────────────────────────────────────
    socket.on("call:initiate", ({ targetUserId, callType, offer, roomId }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (!targetSocketId) {
        return socket.emit("call:declined", { reason: "User is offline" });
      }
 
      // Get caller info from socket
      const callerId = socket.userId;
      // Forward call invitation to target
      io.to(targetSocketId).emit("call:incoming", {
        callerId,
        callerName: socket.callerName || "Unknown",
        callerAvatar: socket.callerAvatar || "",
        callType,
        offer,
        roomId,
      });
    });
 
    // ── Store caller info when they go online ─────────────────
    // (caller name/avatar sent with user:online_meta event)
    socket.on("user:meta", ({ name, avatar }) => {
      socket.callerName  = name;
      socket.callerAvatar = avatar;
    });
 
    // ── Accept call ───────────────────────────────────────────
    socket.on("call:accept", ({ callerId, answer, roomId }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:accepted", { answer, roomId });
      }
    });
 
    // ── Decline call ──────────────────────────────────────────
    socket.on("call:decline", ({ callerId, roomId }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:declined", { roomId });
      }
    });
 
    // ── End call ──────────────────────────────────────────────
    socket.on("call:end", ({ roomId }) => {
      socket.to(roomId).emit("call:ended", { roomId });
    });
 
    // ── ICE candidate relay ───────────────────────────────────
    socket.on("call:ice-candidate", ({ candidate, roomId }) => {
      socket.to(roomId).emit("call:ice-candidate", { candidate });
    });
 
    // ── Disconnect ────────────────────────────────────────────
    socket.on("disconnect", async () => {
      const userId = socket.userId;
      if (userId) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit("users:online", Array.from(onlineUsers.keys()));
      }
    });
  });
};
 
module.exports = { initializeSocket, onlineUsers };
 