import { useEffect } from "react";
import socket from "../utils/socket";
import useChatStore from "../context/chatStore";
import useAuthStore from "../context/authStore";
import useCallStore from "../context/callStore";
import { toast } from "react-hot-toast";
 
const useSocket = () => {
  const { user } = useAuthStore();
  const { receiveMessage, setOnlineUsers, setTyping, clearTyping } = useChatStore();
  const { setIncomingCall, setCallConnected, setIceCandidate, endCall } = useCallStore();
 
  useEffect(() => {
    if (!user) return;
    if (!socket.connected) { socket.connect(); socket.emit("user:online", user._id); }
 
    const onMessage = (message) => {
      receiveMessage(message, user._id);
      if (document.hidden && Notification.permission === "granted") {
        new Notification(`${message.sender?.username}`, { body: message.type === "text" ? message.content : "📎 Sent a file", icon: "/favicon.svg" });
      }
    };
    const onUsersOnline = (ids) => setOnlineUsers(ids);
    const onTypingStart = ({ username }) => { const r = useChatStore.getState().activeRoom; if (r) setTyping(r._id, username); };
    const onTypingStop  = () => { const r = useChatStore.getState().activeRoom; if (r) clearTyping(r._id); };
    const onCallIncoming = (data) => { setIncomingCall(data); toast("📞 Incoming call!", { duration: 30000 }); };
    const onCallAccepted = ({ answer }) => setCallConnected(answer);
    const onCallDeclined = () => { endCall(); toast("Call declined", { icon: "📵" }); };
    const onCallEnded    = () => { endCall(); toast("Call ended", { icon: "📞" }); };
    const onIceCandidate = ({ candidate }) => setIceCandidate(candidate);
    const onReaction     = ({ messageId, emoji, userId }) => useChatStore.getState().updateReaction?.(messageId, emoji, userId);
 
    socket.on("message:receive", onMessage);
    socket.on("users:online", onUsersOnline);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("call:incoming", onCallIncoming);
    socket.on("call:accepted", onCallAccepted);
    socket.on("call:declined", onCallDeclined);
    socket.on("call:ended", onCallEnded);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("message:reaction", onReaction);
 
    if (Notification.permission === "default") Notification.requestPermission();
 
    return () => {
      socket.off("message:receive", onMessage);
      socket.off("users:online", onUsersOnline);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("call:incoming", onCallIncoming);
      socket.off("call:accepted", onCallAccepted);
      socket.off("call:declined", onCallDeclined);
      socket.off("call:ended", onCallEnded);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("message:reaction", onReaction);
    };
  }, [user]);
};
 
export default useSocket;
 