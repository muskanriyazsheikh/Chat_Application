import { create } from "zustand";
import socket from "../utils/socket";
 
const useCallStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────
  incomingCall: null,       // { callerId, callerName, callerAvatar, callType, offer, roomId }
  activeCall: null,         // { peerId, peerName, peerAvatar, callType, roomId, startTime }
  callStatus: null,         // "calling" | "ringing" | "connected" | "ended"
  localStream: null,        // MediaStream
  remoteStream: null,       // MediaStream
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  callDuration: 0,          // seconds
  peerConnection: null,     // RTCPeerConnection
 
  // ── Initiate a call ───────────────────────────────────────────
  initiateCall: async (peerId, peerName, peerAvatar, callType = "voice") => {
    try {
      const constraints = callType === "video"
        ? { video: true, audio: true }
        : { video: false, audio: true };
 
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const pc = createPeerConnection(stream, set, get);
 
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
 
      const roomId = `call_${Date.now()}`;
 
      set({
        localStream: stream,
        peerConnection: pc,
        callStatus: "calling",
        activeCall: { peerId, peerName, peerAvatar, callType, roomId, startTime: null },
      });
 
      // Emit call invitation to peer
      socket.emit("call:initiate", {
        targetUserId: peerId,
        callType,
        offer,
        roomId,
      });
 
      // Timeout after 30s if no answer
      setTimeout(() => {
        if (get().callStatus === "calling") {
          get().endCall();
        }
      }, 30000);
 
    } catch (err) {
      console.error("Call initiation error:", err);
      set({ callStatus: null, activeCall: null });
      throw err;
    }
  },
 
  // ── Accept incoming call ───────────────────────────────────────
  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;
 
    try {
      const constraints = incomingCall.callType === "video"
        ? { video: true, audio: true }
        : { video: false, audio: true };
 
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const pc = createPeerConnection(stream, set, get);
 
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
 
      set({
        localStream: stream,
        peerConnection: pc,
        callStatus: "connected",
        activeCall: {
          peerId: incomingCall.callerId,
          peerName: incomingCall.callerName,
          peerAvatar: incomingCall.callerAvatar,
          callType: incomingCall.callType,
          roomId: incomingCall.roomId,
          startTime: Date.now(),
        },
        incomingCall: null,
      });
 
      socket.emit("call:accept", {
        callerId: incomingCall.callerId,
        answer,
        roomId: incomingCall.roomId,
      });
 
    } catch (err) {
      console.error("Accept call error:", err);
    }
  },
 
  // ── Decline call ──────────────────────────────────────────────
  declineCall: () => {
    const { incomingCall } = get();
    if (incomingCall) {
      socket.emit("call:decline", {
        callerId: incomingCall.callerId,
        roomId: incomingCall.roomId,
      });
    }
    set({ incomingCall: null, callStatus: null });
  },
 
  // ── End active call ───────────────────────────────────────────
  endCall: () => {
    const { peerConnection, localStream, activeCall, incomingCall } = get();
 
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
 
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }
 
    // Notify peer
    const roomId = activeCall?.roomId || incomingCall?.roomId;
    if (roomId) {
      socket.emit("call:end", { roomId });
    }
 
    set({
      incomingCall: null,
      activeCall: null,
      callStatus: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      callDuration: 0,
    });
  },
 
  // ── Toggle mute ───────────────────────────────────────────────
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
      set({ isMuted: !isMuted });
    }
  },
 
  // ── Toggle camera ─────────────────────────────────────────────
  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => { t.enabled = isCameraOff; });
      set({ isCameraOff: !isCameraOff });
    }
  },
 
  // ── Screen share ─────────────────────────────────────────────
  toggleScreenShare: async () => {
    const { isScreenSharing, peerConnection, localStream } = get();
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
 
        // Replace video track in peer connection
        const sender = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);
 
        screenTrack.onended = () => get().toggleScreenShare();
        set({ isScreenSharing: true });
      } else {
        // Restore camera
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        const sender = peerConnection?.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(camTrack);
        set({ isScreenSharing: false });
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  },
 
  // ── Setters (called by socket hooks) ─────────────────────────
  setIncomingCall: (data) => set({ incomingCall: data, callStatus: "ringing" }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setCallConnected: (answer) => {
    const { peerConnection } = get();
    if (peerConnection) {
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => {
          set({
            callStatus: "connected",
            activeCall: { ...get().activeCall, startTime: Date.now() },
          });
        });
    }
  },
  setIceCandidate: async (candidate) => {
    const { peerConnection } = get();
    if (peerConnection && candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {}
    }
  },
  incrementDuration: () => set((s) => ({ callDuration: s.callDuration + 1 })),
}));
 
// ── WebRTC peer connection factory ────────────────────────────
function createPeerConnection(localStream, set, get) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });
 
  // Add local tracks
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
 
  // Receive remote stream
  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
    set({ remoteStream });
  };
 
  // Send ICE candidates to peer
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const roomId = get().activeCall?.roomId || get().incomingCall?.roomId;
      socket.emit("call:ice-candidate", { candidate: event.candidate, roomId });
    }
  };
 
  pc.onconnectionstatechange = () => {
    if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
      get().endCall();
    }
  };
 
  return pc;
}
 
export default useCallStore;
 