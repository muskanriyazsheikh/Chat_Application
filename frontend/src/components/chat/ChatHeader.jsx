// src/components/chat/ChatHeader.jsx
import useChatStore from "../../context/chatStore";
import useAuthStore from "../../context/authStore";
import Avatar from "../ui/Avatar";
import { getDMName, getDMAvatar, isUserOnline, formatLastSeen } from "../../utils/helpers";

export default function ChatHeader({ onMenuToggle }) {
  const { activeRoom, onlineUsers } = useChatStore();
  const { user } = useAuthStore();

  if (!activeRoom) return null;

  const isGroup = activeRoom.type === "group";
  const dmPartner = isGroup ? null : getDMAvatar(activeRoom, user._id);
  const displayName = getDMName(activeRoom, user._id);
  const online = !isGroup && isUserOnline(dmPartner?._id, onlineUsers);
  const memberCount = activeRoom.participants?.length || 0;

  return (
    <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      {/* Avatar */}
      {isGroup ? (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {activeRoom.name?.slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <Avatar user={dmPartner} size="md" showOnline isOnline={online} />
      )}

      {/* Name & status */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h2>
        <p className="text-xs text-gray-400">
          {isGroup
            ? `${memberCount} members`
            : online
              ? "Active now"
              : dmPartner?.lastSeen
                ? `Last seen ${formatLastSeen(dmPartner.lastSeen)}`
                : "Offline"
          }
        </p>
      </div>

      {/* Group members avatars */}
      {isGroup && (
        <div className="hidden sm:flex items-center -space-x-2">
          {activeRoom.participants?.slice(0, 4).map((p) => (
            <Avatar key={p._id} user={p} size="sm" showOnline isOnline={isUserOnline(p._id, onlineUsers)} />
          ))}
          {memberCount > 4 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-900">
              +{memberCount - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
