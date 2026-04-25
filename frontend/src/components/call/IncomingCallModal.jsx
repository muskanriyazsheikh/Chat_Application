// src/components/call/IncomingCallModal.jsx
import { useEffect, useState } from "react";
import useCallStore from "../../context/callStore";
import Avatar from "../ui/Avatar";

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, declineCall } = useCallStore();
  const [ringing, setRinging] = useState(0);

  // Pulse animation counter
  useEffect(() => {
    if (!incomingCall) return;
    const t = setInterval(() => setRinging((r) => r + 1), 1000);
    return () => clearInterval(t);
  }, [incomingCall]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === "video";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-80 text-center">
        {/* Pulsing avatar */}
        <div className="relative flex justify-center mb-6">
          <div className={`absolute inset-0 flex items-center justify-center`}>
            <div className={`w-24 h-24 rounded-full bg-brand-200 dark:bg-brand-800 opacity-30 scale-${ringing % 2 === 0 ? "110" : "125"} transition-transform duration-1000`} />
          </div>
          <div className="relative">
            <Avatar
              user={{ username: incomingCall.callerName, avatar: incomingCall.callerAvatar }}
              size="xl"
            />
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
          Incoming {isVideo ? "Video" : "Voice"} Call
        </p>
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-1">
          {incomingCall.callerName}
        </h2>
        <p className="text-brand-500 text-sm mb-8 animate-pulse">
          {isVideo ? "📹" : "📞"} Ringing…
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-8">
          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={declineCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
            >
              <svg className="w-7 h-7 text-white rotate-135" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all animate-bounce"
            >
              {isVideo ? (
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
