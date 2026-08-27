"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with "light" on both server and initial client render to avoid hydration mismatch.
  // Sync from localStorage after mount (layout's inline script already sets class pre-hydration to avoid flicker).
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("safha-theme");
      if (stored === "dark" || stored === "light") {
        setTheme(stored);
        if (stored === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        return;
      }
    } catch {}
    // fallback sync with document class set by inline script
    if (document.documentElement.classList.contains("dark")) setTheme("dark");
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("safha-theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
