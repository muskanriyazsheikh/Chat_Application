// src/context/chatStore.js - Zustand store for chat state
import { create } from "zustand";
import api from "../utils/api";
import socket from "../utils/socket";

const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: {},       // { [roomId]: Message[] }
  onlineUsers: [],    // array of userId strings
  typingUsers: {},    // { [roomId]: username | null }
  loading: false,
  messageLoading: false,
  unreadCounts: {},   // { [roomId]: number }

  // ── Fetch all rooms ───────────────────────────────────────────
  fetchRooms: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/rooms");
      set({ rooms: data.rooms, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // ── Set active room & load messages ──────────────────────────
  setActiveRoom: async (room, currentUserId) => {
    set({ activeRoom: room });

    // Join socket room
    socket.emit("room:join", room._id);

    // Mark messages as read
    socket.emit("messages:read", { roomId: room._id, userId: currentUserId });

    // Clear unread count
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [room._id]: 0 },
    }));

    // Fetch messages if not already loaded
    if (!get().messages[room._id]) {
      set({ messageLoading: true });
      try {
        const { data } = await api.get(`/messages/${room._id}`);
        set((state) => ({
          messages: { ...state.messages, [room._id]: data.messages },
          messageLoading: false,
        }));
      } catch {
        set({ messageLoading: false });
      }
    }
  },

  // ── Open or create DM ─────────────────────────────────────────
  openDM: async (recipientId, currentUserId) => {
    try {
      const { data } = await api.post("/rooms/dm", { recipientId });
      const room = data.room;

      // Add to rooms list if not present
      set((state) => {
        const exists = state.rooms.find((r) => r._id === room._id);
        return { rooms: exists ? state.rooms : [room, ...state.rooms] };
      });

      await get().setActiveRoom(room, currentUserId);
      return room;
    } catch (err) {
      console.error("openDM error:", err);
    }
  },

  // ── Create group room ─────────────────────────────────────────
  createGroup: async (name, participantIds, description = "") => {
    try {
      const { data } = await api.post("/rooms/group", { name, participantIds, description });
      set((state) => ({ rooms: [data.room, ...state.rooms] }));
      return { success: true, room: data.room };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  // ── Receive new message via socket ────────────────────────────
  receiveMessage: (message, currentUserId) => {
    const roomId = message.room;
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      // Prevent duplicates
      const exists = roomMessages.find((m) => m._id === message._id);
      if (exists) return {};

      const updatedMessages = { ...state.messages, [roomId]: [...roomMessages, message] };

      // Update room's last message preview
      const updatedRooms = state.rooms.map((r) =>
        r._id === roomId ? { ...r, lastMessage: message, updatedAt: message.createdAt } : r
      );
      // Sort rooms by latest message
      updatedRooms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      // Increment unread if not the active room
      const isActive = state.activeRoom?._id === roomId;
      const isOwnMessage = message.sender?._id === currentUserId;
      const unreadCounts = { ...state.unreadCounts };
      if (!isActive && !isOwnMessage) {
        unreadCounts[roomId] = (unreadCounts[roomId] || 0) + 1;
      }

      return { messages: updatedMessages, rooms: updatedRooms, unreadCounts };
    });
  },

  // ── Set online users ──────────────────────────────────────────
  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

  // ── Typing indicators ─────────────────────────────────────────
  setTyping: (roomId, username) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [roomId]: username },
    }));
  },
  clearTyping: (roomId) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [roomId]: null },
    }));
  },

  // ── Upload file ───────────────────────────────────────────────
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/messages/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
}));

export default useChatStore;
