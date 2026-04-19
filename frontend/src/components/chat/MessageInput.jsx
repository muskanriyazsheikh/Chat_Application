// src/components/chat/MessageInput.jsx
import { useState, useRef, useCallback } from "react";
import EmojiPicker from "emoji-picker-react";
import socket from "../../utils/socket";
import useChatStore from "../../context/chatStore";
import useAuthStore from "../../context/authStore";
import { toast } from "react-hot-toast";

export default function MessageInput() {
  const { activeRoom, uploadFile } = useChatStore();
  const { user } = useAuthStore();

  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Typing indicator helpers ──────────────────────────────────
  const emitTypingStart = useCallback(() => {
    if (!isTypingRef.current && activeRoom) {
      socket.emit("typing:start", { roomId: activeRoom._id, username: user.username });
      isTypingRef.current = true;
    }
  }, [activeRoom, user]);

  const emitTypingStop = useCallback(() => {
    if (isTypingRef.current && activeRoom) {
      socket.emit("typing:stop", { roomId: activeRoom._id });
      isTypingRef.current = false;
    }
  }, [activeRoom]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTypingStart();

    // Auto-clear typing after 2 seconds of no typing
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitTypingStop, 2000);

    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  // ── Send text message ─────────────────────────────────────────
  const sendMessage = () => {
    const content = text.trim();
    if (!content || !activeRoom) return;

    socket.emit("message:send", {
      roomId: activeRoom._id,
      senderId: user._id,
      content,
      type: "text",
    });

    setText("");
    emitTypingStop();

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // ── Send file / image ─────────────────────────────────────────
  const sendFile = async (file) => {
    if (!file || !activeRoom) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return toast.error("File too large. Max 10MB.");
    }

    setUploading(true);
    try {
      const result = await uploadFile(file);
      socket.emit("message:send", {
        roomId: activeRoom._id,
        senderId: user._id,
        content: text.trim() || "",
        type: result.type,       // "image" or "file"
        fileUrl: result.url,
        fileName: result.fileName || file.name,
      });
      setText("");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) sendFile(file);
    e.target.value = ""; // Reset input
  };

  // ── Keyboard shortcuts ────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Emoji picker ──────────────────────────────────────────────
  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  // ── Drag & drop ───────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) sendFile(file);
  };

  if (!activeRoom) return null;

  return (
    <div
      className={`p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 transition-colors ${dragOver ? "bg-brand-50 dark:bg-brand-900/20" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-brand-400 rounded-xl bg-brand-50/80 dark:bg-brand-900/40 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-brand-600 font-medium">Drop to upload</p>
        </div>
      )}

      {/* Emoji picker popup */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden animate-fade-in">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={document.documentElement.classList.contains("dark") ? "dark" : "light"}
            width={320}
            height={380}
            searchDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji button */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
            showEmoji
              ? "bg-brand-100 dark:bg-brand-900/40 text-brand-600"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Emoji"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>

        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 disabled:opacity-50"
          title="Attach file"
        >
          {uploading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.doc,.docx"
          onChange={handleFileChange}
        />

        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            className="input resize-none py-2.5 pr-4 leading-relaxed"
            placeholder="Type a message… (Shift+Enter for new line)"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={emitTypingStop}
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={sendMessage}
          disabled={!text.trim() && !uploading}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-150 ${
            text.trim()
              ? "bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/30"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
          }`}
          title="Send (Enter)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </div>

      {/* Click outside to close emoji */}
      {showEmoji && (
        <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
      )}
    </div>
  );
}
