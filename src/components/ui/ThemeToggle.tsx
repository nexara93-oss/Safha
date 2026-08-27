"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      suppressHydrationWarning
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white text-brand-ink transition-all hover:border-brand-orange hover:text-brand-orange dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-brand-orange dark:hover:text-brand-orange ${className}`}
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-500 ${
          theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-500 ${
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
}
