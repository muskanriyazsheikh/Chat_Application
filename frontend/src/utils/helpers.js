// src/utils/helpers.js - Shared utility functions
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

/**
 * Format a message timestamp for display in chat bubbles
 */
export const formatMessageTime = (dateStr) => {
  const date = new Date(dateStr);
  return format(date, "h:mm a");
};

/**
 * Format a date for chat list (Today / Yesterday / date)
 */
export const formatChatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

/**
 * Format last seen time
 */
export const formatLastSeen = (dateStr) => {
  if (!dateStr) return "Unknown";
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
};

/**
 * Generate initials avatar color based on username
 */
export const getAvatarColor = (name = "") => {
  const colors = [
    "bg-rose-500", "bg-pink-500", "bg-fuchsia-500", "bg-purple-500",
    "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-cyan-500",
    "bg-teal-500", "bg-emerald-500", "bg-green-500", "bg-amber-500",
    "bg-orange-500", "bg-red-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get initials from username
 */
export const getInitials = (name = "") => {
  return name.slice(0, 2).toUpperCase();
};

/**
 * Get the display name for a DM room
 * (the other participant's name, not self)
 */
export const getDMName = (room, currentUserId) => {
  if (room.type === "group") return room.name;
  const other = room.participants?.find((p) => p._id !== currentUserId);
  return other?.username || "Unknown";
};

/**
 * Get the display avatar for a room
 */
export const getDMAvatar = (room, currentUserId) => {
  if (room.type === "group") return null;
  const other = room.participants?.find((p) => p._id !== currentUserId);
  return other;
};

/**
 * Check if a user is online
 */
export const isUserOnline = (userId, onlineUsers = []) => {
  return onlineUsers.includes(userId);
};

/**
 * Truncate long strings
 */
export const truncate = (str = "", maxLength = 40) => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
};
