// src/components/ui/Avatar.jsx
import { getAvatarColor, getInitials } from "../../utils/helpers";

export default function Avatar({ user, size = "md", showOnline = false, isOnline = false }) {
  const sizeMap = {
    xs: "w-7 h-7 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };
  const dotSizeMap = {
    xs: "w-2 h-2",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
  };

  const name = user?.username || "?";
  const avatarColor = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div className="relative flex-shrink-0">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold`}
        >
          {initials}
        </div>
      )}

      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizeMap[size]} rounded-full border-2 border-white dark:border-gray-900 ${
            isOnline ? "bg-emerald-500" : "bg-gray-400"
          }`}
        />
      )}
    </div>
  );
}
