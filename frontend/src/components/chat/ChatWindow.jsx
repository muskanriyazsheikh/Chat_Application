// src/components/chat/ChatWindow.jsx
import { useEffect, useRef } from "react";
import useChatStore from "../../context/chatStore";
import useAuthStore from "../../context/authStore";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";

// Typing indicator animation
function TypingIndicator({ username }) {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-8 flex-shrink-0" />
      <div className="flex flex-col gap-0.5 items-start">
        <span className="text-xs text-gray-400 ml-1">{username}</span>
        <div className="message-bubble-other flex items-center gap-1 py-3 px-4">
          <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
        </div>
      </div>
    </div>
  );
}

// Empty state when no room is selected
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-brand-500/30">
        💬
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-800 dark:text-gray-100 mb-2">
        Welcome to Nexus Chat
      </h2>
      <p className="text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
        Select a conversation from the sidebar or search for a user to start chatting.
      </p>
    </div>
  );
}

export default function ChatWindow({ onMenuToggle }) {
  const { activeRoom, messages, messageLoading, typingUsers } = useChatStore();
  const { user } = useAuthStore();

  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const roomMessages = activeRoom ? (messages[activeRoom._id] || []) : [];
  const typingUsername = activeRoom ? typingUsers[activeRoom._id] : null;

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Only auto-scroll if user is near the bottom (within 200px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom || typingUsername) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomMessages.length, typingUsername]);

  // Scroll to bottom when entering a room
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }, 50);
  }, [activeRoom?._id]);

  if (!activeRoom) {
    return (
      <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        <div className="h-16 px-4 flex items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 lg:hidden">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
        <EmptyState />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 min-w-0 overflow-hidden">
      {/* Header */}
      <ChatHeader onMenuToggle={onMenuToggle} />

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {/* Loading spinner */}
        {messageLoading && (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        )}

        {/* Empty room */}
        {!messageLoading && roomMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {/* Message list */}
        {roomMessages.map((msg, idx) => {
          const prev = roomMessages[idx - 1];
          const next = roomMessages[idx + 1];
          // Show avatar if this is the last message in a sequence from the same sender
          const showAvatar =
            !next ||
            next.sender?._id !== msg.sender?._id ||
            new Date(next.createdAt) - new Date(msg.createdAt) > 5 * 60 * 1000;

          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              showAvatar={showAvatar}
              prevMessage={prev}
            />
          );
        })}

        {/* Typing indicator */}
        {typingUsername && <TypingIndicator username={typingUsername} />}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <MessageInput />
    </main>
  );
}
