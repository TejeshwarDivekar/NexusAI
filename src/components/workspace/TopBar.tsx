"use client";

import React from "react";
import {
  Search,
  FolderKanban,
  HelpCircle,
  Command,
  Plus,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface TopBarProps {
  currentProjectTitle?: string;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onNewResearch: () => void;
  onOpenProjects: () => void;
  userEmail?: string;
}

export function TopBar({
  currentProjectTitle = "General Investigation",
  onOpenCommandPalette,
  onOpenShortcuts,
  onNewResearch,
  onOpenProjects,
  userEmail = "researcher@nexusai.com",
}: TopBarProps) {
  return (
    <header
      style={{
        height: "52px",
        borderBottom: "1px solid var(--border-primary)",
        backgroundColor: "var(--bg-surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Left: Project Context & Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onOpenProjects}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid transparent",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <FolderKanban size={14} color="var(--accent-primary)" />
          <span>Projects</span>
        </button>

        <ChevronRight size={13} color="var(--text-tertiary)" />

        <div
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--text-primary)",
            maxWidth: "260px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {currentProjectTitle}
        </div>
      </div>

      {/* Center: Global Search / Command Palette Bar */}
      <div style={{ flex: 1, maxWidth: "380px", margin: "0 16px" }}>
        <button
          onClick={onOpenCommandPalette}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-subtle)",
            color: "var(--text-tertiary)",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.borderColor = "var(--border-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
            e.currentTarget.style.borderColor = "var(--border-primary)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={14} />
            <span>Search or type a command...</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "1px 5px",
              borderRadius: "4px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--text-secondary)",
            }}
          >
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={onNewResearch}
        >
          New Research
        </Button>

        <button
          onClick={onOpenShortcuts}
          aria-label="Keyboard Shortcuts"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-primary)",
            background: "var(--bg-subtle)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
        >
          <HelpCircle size={15} />
        </button>

        <ThemeToggle />

        {/* User Badge */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--accent-subtle)",
            color: "var(--accent-primary)",
            border: "1px solid var(--accent-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 650,
            userSelect: "none",
          }}
          title={userEmail}
        >
          {userEmail.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
