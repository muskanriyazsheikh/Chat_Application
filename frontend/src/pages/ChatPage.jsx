// src/pages/ChatPage.jsx - Main chat layout
import { useState, useEffect } from "react";
import Sidebar from "../components/chat/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import useChatStore from "../context/chatStore";
import useAuthStore from "../context/authStore";
import socket from "../utils/socket";

export default function ChatPage() {
  const { user } = useAuthStore();
  const { setActiveRoom, fetchRooms } = useChatStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ensure socket is connected and user is online
  useEffect(() => {
    if (user && !socket.connected) {
      socket.connect();
      socket.emit("user:online", user._id);
    }
    fetchRooms();
  }, [user]);

  const handleRoomSelect = async (room) => {
    await setActiveRoom(room, user._id);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-950 relative">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        onRoomSelect={handleRoomSelect}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Chat window */}
      <ChatWindow onMenuToggle={() => setMobileOpen(true)} />
    </div>
  );
}
