"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { key: "⌘ / Ctrl + K", description: "Open global command palette and search" },
    { key: "⌘ / Ctrl + Enter", description: "Submit and start deep research" },
    { key: "Esc", description: "Close open modal, drawer, or cancel action" },
    { key: "1 - 5", description: "Switch between sidebar views (Launchpad, Room, etc.)" },
    { key: "⌘ / Ctrl + U", description: "Open document upload modal" },
    { key: "⌘ / Ctrl + E", description: "Export current report as Markdown" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="480px">
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {shortcuts.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <span style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
              {s.description}
            </span>
            <kbd
              style={{
                padding: "3px 8px",
                borderRadius: "var(--radius-xs)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-secondary)",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
