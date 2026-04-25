// src/context/authStore.js - Zustand store for auth state
import { create } from "zustand";
import api from "../utils/api";
import socket from "../utils/socket";
 
const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
 
  // ── Register ─────────────────────────────────────────────────
  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", { username, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
 
      // Connect socket and announce online status
      socket.connect();
      socket.emit("user:online", data.user._id);
 
      // ✅ Send caller name + avatar so call screen shows correct info
      socket.emit("user:meta", {
        name: data.user.username,
        avatar: data.user.avatar || "",
      });
 
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },
 
  // ── Login ─────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
 
      // Connect socket and announce online status
      socket.connect();
      socket.emit("user:online", data.user._id);
 
      // ✅ Send caller name + avatar so call screen shows correct info
      socket.emit("user:meta", {
        name: data.user.username,
        avatar: data.user.avatar || "",
      });
 
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },
 
  // ── Logout ────────────────────────────────────────────────────
  logout: () => {
    socket.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
 
  // ── Update profile ────────────────────────────────────────────
  updateProfile: async (profileData) => {
    try {
      const { data } = await api.put("/auth/profile", profileData);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ user: data.user });
 
      // ✅ Re-emit user:meta if name or avatar was updated
      socket.emit("user:meta", {
        name: data.user.username,
        avatar: data.user.avatar || "",
      });
 
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },
 
  clearError: () => set({ error: null }),
}));
 
export default useAuthStore;
 