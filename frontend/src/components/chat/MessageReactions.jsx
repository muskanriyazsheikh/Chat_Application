// src/components/chat/MessageReactions.jsx
import { useState } from "react";
import socket from "../../utils/socket";
import useAuthStore from "../../context/authStore";
import useChatStore from "../../context/chatStore";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

export default function MessageReactions({ message, isSelf }) {
  const { user } = useAuthStore();
  const { activeRoom } = useChatStore();
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji) => {
    socket.emit("message:react", {
      messageId: message._id,
      roomId: activeRoom._id,
      userId: user._id,
      emoji,
    });
    setShowPicker(false);
  };

  // Group reactions: { emoji: [userId, ...] }
  const grouped = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || [];
    acc[r.emoji].push(r.userId);
    return acc;
  }, {});

  return (
    <div className={`relative flex items-center gap-1 flex-wrap mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
      {/* Existing reactions */}
      {Object.entries(grouped).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
            ${users.includes(user._id)
              ? "bg-brand-100 dark:bg-brand-900/40 border-brand-300 dark:border-brand-700"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
        >
          <span>{emoji}</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{users.length}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all text-xs border border-gray-200 dark:border-gray-700"
        >
          +
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className={`absolute z-20 bottom-8 ${isSelf ? "right-0" : "left-0"} bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 flex gap-1 animate-slide-in`}>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
