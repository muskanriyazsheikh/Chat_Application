// src/hooks/useDarkMode.js - Persistent dark mode toggle
import { useState, useEffect } from "react";

const useDarkMode = () => {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("darkMode", dark);
  }, [dark]);

  return [dark, setDark];
};

export default useDarkMode;
