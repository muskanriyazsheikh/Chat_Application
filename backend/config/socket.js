const Message = require("../models/Message");
const User = require("../models/User");
 
// Map to track online users: userId -> socketId
const onlineUsers = new Map();
 
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
 
    // ─── User comes online ────────────────────────────────────
    socket.on("user:online", async (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
 
      // Update user's online status in DB
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });
 
      // Broadcast updated online users list to everyone
      io.emit("users:online", Array.from(onlineUsers.keys()));
      console.log(`👤 User online: ${userId}`);
    });
 
    // ─── Join a chat room ─────────────────────────────────────
    socket.on("room:join", (roomId) => {
      socket.join(roomId);
      console.log(`🏠 Socket ${socket.id} joined room: ${roomId}`);
    });
 
    // ─── Leave a chat room ────────────────────────────────────
    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      console.log(`🚪 Socket ${socket.id} left room: ${roomId}`);
    });
 
    // ─── Send a message ───────────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const { roomId, senderId, content, type = "text", fileUrl } = data;
 
        // Save message to DB
        const message = await Message.create({
          room: roomId,
          sender: senderId,
          content,
          type,
          fileUrl: fileUrl || null,
          readBy: [senderId],
        });
 
        // Populate sender details before emitting
        const populated = await message.populate("sender", "username avatar");
 
        // Emit to everyone in the room (including sender)
        io.to(roomId).emit("message:receive", populated);
      } catch (err) {
        console.error("message:send error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
 
    // ─── Typing indicators ────────────────────────────────────
    socket.on("typing:start", ({ roomId, username }) => {
      socket.to(roomId).emit("typing:start", { username });
    });
 
    socket.on("typing:stop", ({ roomId }) => {
      socket.to(roomId).emit("typing:stop");
    });
 
    // ─── Mark messages as read ────────────────────────────────
    socket.on("messages:read", async ({ roomId, userId }) => {
      try {
        await Message.updateMany(
          { room: roomId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        // Notify room that messages were read
        io.to(roomId).emit("messages:read", { roomId, userId });
      } catch (err) {
        console.error("messages:read error:", err);
      }
    });
 
    // ─── Disconnect ───────────────────────────────────────────
    socket.on("disconnect", async () => {
      const userId = socket.userId;
      if (userId) {
        onlineUsers.delete(userId);
 
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
 
        io.emit("users:online", Array.from(onlineUsers.keys()));
        console.log(`❌ User offline: ${userId}`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
 
module.exports = { initializeSocket, onlineUsers };