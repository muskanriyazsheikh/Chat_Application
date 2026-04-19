// src/hooks/useSocket.js - Register all socket listeners
import { useEffect } from "react";
import socket from "../utils/socket";
import useChatStore from "../context/chatStore";
import useAuthStore from "../context/authStore";

const useSocket = () => {
  const { user } = useAuthStore();
  const { receiveMessage, setOnlineUsers, setTyping, clearTyping } = useChatStore();

  useEffect(() => {
    if (!user) return;

    // Connect and announce presence
    if (!socket.connected) {
      socket.connect();
      socket.emit("user:online", user._id);
    }

    // ── Incoming message ──────────────────────────────────────
    const onMessage = (message) => {
      receiveMessage(message, user._id);

      // Browser notification if tab not focused
      if (document.hidden && Notification.permission === "granted") {
        new Notification(`${message.sender?.username}`, {
          body: message.type === "text" ? message.content : "📎 Sent a file",
          icon: "/favicon.svg",
        });
      }
    };

    // ── Online users list ─────────────────────────────────────
    const onUsersOnline = (userIds) => setOnlineUsers(userIds);

    // ── Typing ────────────────────────────────────────────────
    const onTypingStart = ({ username }) => {
      // We need the active room here — find it via store
      const activeRoom = useChatStore.getState().activeRoom;
      if (activeRoom) setTyping(activeRoom._id, username);
    };
    const onTypingStop = () => {
      const activeRoom = useChatStore.getState().activeRoom;
      if (activeRoom) clearTyping(activeRoom._id);
    };

    socket.on("message:receive", onMessage);
    socket.on("users:online", onUsersOnline);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      socket.off("message:receive", onMessage);
      socket.off("users:online", onUsersOnline);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [user]);
};

export default useSocket;
