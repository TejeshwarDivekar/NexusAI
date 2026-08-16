"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 10,
        border: "1px solid var(--border-primary)",
        background: "var(--bg-tertiary)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-hover)";
        e.currentTarget.style.color = "var(--text-primary)";
        e.currentTarget.style.borderColor = "var(--border-focus)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-tertiary)";
        e.currentTarget.style.color = "var(--text-secondary)";
        e.currentTarget.style.borderColor = "var(--border-primary)";
      }}
    >
      <div
        style={{
          transition: "transform 0.4s ease, opacity 0.3s ease",
          transform: theme === "dark" ? "rotate(0deg)" : "rotate(180deg)",
          opacity: theme === "dark" ? 1 : 0,
          position: "absolute",
        }}
      >
        <Moon size={16} />
      </div>
      <div
        style={{
          transition: "transform 0.4s ease, opacity 0.3s ease",
          transform: theme === "light" ? "rotate(0deg)" : "rotate(-180deg)",
          opacity: theme === "light" ? 1 : 0,
          position: "absolute",
        }}
      >
        <Sun size={16} />
      </div>
    </button>
  );
}
