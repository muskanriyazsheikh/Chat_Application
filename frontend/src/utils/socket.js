// src/utils/socket.js - Socket.IO client singleton
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Create a single socket instance for the entire app
const socket = io(SOCKET_URL, {
  autoConnect: false, // Connect manually after auth
  withCredentials: true,
  transports: ["websocket", "polling"],
});

export default socket;
