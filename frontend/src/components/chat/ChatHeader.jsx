// src/components/chat/ChatHeader.jsx - Updated with call + profile buttons
import { useState } from "react";
import useChatStore from "../../context/chatStore";
import useAuthStore from "../../context/authStore";
import useCallStore from "../../context/callStore";
import Avatar from "../ui/Avatar";
import ProfilePanel from "../profile/ProfilePanel";
import { getDMName, getDMAvatar, isUserOnline, formatLastSeen } from "../../utils/helpers";
import { toast } from "react-hot-toast";

export default function ChatHeader({ onMenuToggle }) {
  const { activeRoom, onlineUsers, typingUsers } = useChatStore();
  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();
  const [showProfile, setShowProfile] = useState(false);

  if (!activeRoom) return null;

  const isGroup = activeRoom.type === "group";
  const dmPartner = isGroup ? null : getDMAvatar(activeRoom, user._id);
  const displayName = getDMName(activeRoom, user._id);
  const online = !isGroup && isUserOnline(dmPartner?._id, onlineUsers);
  const memberCount = activeRoom.participants?.length || 0;
  const typing = typingUsers[activeRoom._id];

  const handleVoiceCall = () => {
    if (!dmPartner) return toast.error("Calls only available in DMs.");
    initiateCall(dmPartner._id, dmPartner.username, dmPartner.avatar, "voice");
  };

  const handleVideoCall = () => {
    if (!dmPartner) return toast.error("Calls only available in DMs.");
    initiateCall(dmPartner._id, dmPartner.username, dmPartner.avatar, "video");
  };

  return (
    <>
      <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left">
          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {activeRoom.name?.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <Avatar user={dmPartner} size="md" showOnline isOnline={online} />
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h2>
            <p className="text-xs text-gray-400">
              {typing ? <span className="text-emerald-500 animate-pulse">typing…</span>
                : isGroup ? `${memberCount} members`
                : online ? "Active now"
                : dmPartner?.lastSeen ? `Last seen ${formatLastSeen(dmPartner.lastSeen)}` : "Offline"}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {!isGroup && (
            <button onClick={handleVoiceCall} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors" title="Voice Call">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </button>
          )}
          {!isGroup && (
            <button onClick={handleVideoCall} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors" title="Video Call">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </button>
          )}
          <button onClick={() => setShowProfile(true)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors" title="View Profile">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
        </div>
      </div>
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </>
  );
}
