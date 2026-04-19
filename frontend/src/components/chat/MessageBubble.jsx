// src/components/chat/MessageBubble.jsx
import { formatMessageTime } from "../../utils/helpers";
import Avatar from "../ui/Avatar";
import useAuthStore from "../../context/authStore";

export default function MessageBubble({ message, showAvatar, prevMessage }) {
  const { user } = useAuthStore();
  const isSelf = message.sender?._id === user?._id;

  // Show date separator if messages are from different days
  const showDateSep = (() => {
    if (!prevMessage) return true;
    const d1 = new Date(message.createdAt).toDateString();
    const d2 = new Date(prevMessage.createdAt).toDateString();
    return d1 !== d2;
  })();

  const isRead = message.readBy?.length > 1;

  return (
    <>
      {/* Date separator */}
      {showDateSep && (
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <span className="text-xs text-gray-400 px-2">
            {new Date(message.createdAt).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            })}
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
      )}

      <div className={`flex items-end gap-2 animate-slide-in ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar (only for others) */}
        {!isSelf && (
          <div className="w-8 flex-shrink-0">
            {showAvatar && <Avatar user={message.sender} size="sm" />}
          </div>
        )}

        <div className={`flex flex-col gap-0.5 ${isSelf ? "items-end" : "items-start"} max-w-xs lg:max-w-md`}>
          {/* Sender name for groups */}
          {!isSelf && showAvatar && (
            <span className="text-xs text-gray-400 ml-1">{message.sender?.username}</span>
          )}

          {/* Message content */}
          {message.deleted ? (
            <div className={`px-4 py-2.5 rounded-2xl ${isSelf ? "rounded-br-sm" : "rounded-bl-sm"} bg-gray-100 dark:bg-gray-800 text-gray-400 italic text-sm`}>
              🚫 This message was deleted
            </div>
          ) : message.type === "image" ? (
            <div className={`rounded-2xl ${isSelf ? "rounded-br-sm" : "rounded-bl-sm"} overflow-hidden shadow-sm`}>
              <img
                src={message.fileUrl}
                alt="Sent image"
                className="max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => window.open(message.fileUrl, "_blank")}
              />
              {message.content && (
                <p className={`px-3 py-1.5 text-sm ${isSelf ? "bg-brand-600 text-white" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"}`}>
                  {message.content}
                </p>
              )}
            </div>
          ) : message.type === "file" ? (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noreferrer"
              className={`${isSelf ? "message-bubble-self" : "message-bubble-other"} flex items-center gap-2 no-underline`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <span className="text-sm truncate max-w-[160px]">{message.fileName || "File"}</span>
            </a>
          ) : (
            <div className={isSelf ? "message-bubble-self" : "message-bubble-other"}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}

          {/* Timestamp + read receipt */}
          <div className={`flex items-center gap-1 ${isSelf ? "flex-row-reverse" : ""}`}>
            <span className="text-[11px] text-gray-400">{formatMessageTime(message.createdAt)}</span>
            {isSelf && (
              <span className={`text-[11px] ${isRead ? "text-brand-500" : "text-gray-400"}`}>
                {isRead ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
