// src/components/call/ActiveCallScreen.jsx
import { useEffect, useRef, useState } from "react";
import useCallStore from "../../context/callStore";
import Avatar from "../ui/Avatar";

// Format seconds → mm:ss
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function ActiveCallScreen() {
  const {
    activeCall, callStatus, localStream, remoteStream,
    isMuted, isCameraOff, isScreenSharing,
    toggleMute, toggleCamera, toggleScreenShare, endCall,
    callDuration, incrementDuration,
  } = useCallStore();

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const controlTimer = useRef(null);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current  && localStream)  localVideoRef.current.srcObject  = localStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callStatus !== "connected") return;
    const t = setInterval(incrementDuration, 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  // Auto-hide controls after 4s of no interaction
  const resetControlTimer = () => {
    setShowControls(true);
    clearTimeout(controlTimer.current);
    controlTimer.current = setTimeout(() => setShowControls(false), 4000);
  };
  useEffect(() => { resetControlTimer(); return () => clearTimeout(controlTimer.current); }, []);

  if (!activeCall) return null;

  const isVideo = activeCall.callType === "video";
  const isCalling = callStatus === "calling";

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-950 flex flex-col"
      onClick={resetControlTimer}
    >
      {/* ── Video area ─────────────────────────────────────────── */}
      {isVideo ? (
        <div className="relative flex-1 overflow-hidden">
          {/* Remote video (fullscreen) */}
          <video
            ref={remoteVideoRef}
            autoPlay playsInline
            className="w-full h-full object-cover"
          />

          {/* Local video (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-32 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay playsInline muted
              className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""}`}
            />
            {isCameraOff && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Avatar user={{ username: "You" }} size="md" />
              </div>
            )}
          </div>

          {/* Overlay info */}
          <div className={`absolute top-4 left-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
            <p className="text-white font-semibold text-lg">{activeCall.peerName}</p>
            <p className="text-white/70 text-sm">
              {isCalling ? "Calling…" : fmt(callDuration)}
            </p>
          </div>
        </div>
      ) : (
        // ── Voice call UI ────────────────────────────────────────
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-brand-900 to-gray-950">
          {/* Pulsing rings */}
          <div className="relative flex items-center justify-center mb-8">
            {isCalling && (
              <>
                <div className="absolute w-40 h-40 rounded-full bg-brand-500/10 animate-ping" />
                <div className="absolute w-32 h-32 rounded-full bg-brand-500/15 animate-ping" style={{ animationDelay: "0.3s" }} />
              </>
            )}
            <Avatar
              user={{ username: activeCall.peerName, avatar: activeCall.peerAvatar }}
              size="xl"
            />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">{activeCall.peerName}</h2>
          <p className="text-brand-300 text-lg">
            {isCalling ? "Calling…" : callStatus === "connected" ? fmt(callDuration) : "Connecting…"}
          </p>
        </div>
      )}

      {/* ── Controls bar ───────────────────────────────────────── */}
      <div className={`pb-10 pt-4 px-8 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-center gap-5">

          {/* Mute */}
          <ControlBtn
            active={isMuted}
            onClick={toggleMute}
            label={isMuted ? "Unmute" : "Mute"}
            activeColor="bg-white"
            icon={isMuted ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            )}
          />

          {/* Camera (video only) */}
          {isVideo && (
            <ControlBtn
              active={isCameraOff}
              onClick={toggleCamera}
              label={isCameraOff ? "Camera On" : "Camera Off"}
              activeColor="bg-white"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={isCameraOff
                    ? "M21 6.5l-4-4-9.93 9.93-2.5-2.5L3 11.5l4.57 4.57L21 6.5zm-7 7l-4-4 3.5-3.5 4 4L14 13.5zM3.5 5.27L5 3.75 20.25 19l-1.5 1.5L3.5 5.27z"
                    : "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                  }/>
                </svg>
              }
            />
          )}

          {/* Screen share (video only) */}
          {isVideo && (
            <ControlBtn
              active={isScreenSharing}
              onClick={toggleScreenShare}
              label={isScreenSharing ? "Stop Share" : "Share Screen"}
              activeColor="bg-brand-500"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                </svg>
              }
            />
          )}

          {/* End call */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center shadow-lg shadow-red-500/40 transition-all"
          >
            <svg className="w-7 h-7 text-white rotate-135" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable control button ───────────────────────────────────
function ControlBtn({ onClick, icon, label, active, activeColor = "bg-white" }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all
          ${active
            ? `${activeColor} text-gray-900 shadow-lg`
            : "bg-white/20 text-white hover:bg-white/30"
          }`}
      >
        {icon}
      </button>
      <span className="text-white/70 text-xs">{label}</span>
    </div>
  );
}
