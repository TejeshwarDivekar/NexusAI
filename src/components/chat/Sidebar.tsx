"use client";

import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Conversation } from "@/lib/conversations";

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  userName?: string | null;
  userImage?: string | null;
  onSignOut?: () => void;
}

export function Sidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  userName,
  userImage,
  onSignOut,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  if (collapsed) {
    return (
      <div
        style={{
          width: 56,
          height: "100vh",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0",
          gap: 8,
          transition: "width 0.3s ease",
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid var(--border-primary)",
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={onNew}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 280,
        height: "100vh",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-primary)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} color="#fff" />
            </div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
              }}
              className="gradient-text"
            >
              NexusAI
            </span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid var(--border-primary)",
              background: "transparent",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNew}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 12,
            border: "1px dashed var(--border-secondary)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.borderColor = "var(--border-focus)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border-secondary)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <Plus size={16} />
          New Chat
        </button>

        {/* Search */}
        {conversations.length > 3 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid var(--border-primary)",
              background: "var(--bg-input)",
            }}
          >
            <Search size={14} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontSize: 13,
              }}
            />
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: 13,
            }}
          >
            {search ? "No matching chats" : "No conversations yet"}
          </div>
        ) : (
          filtered.map((convo) => (
            <div
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              onMouseEnter={() => setHoveredId(convo.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                background:
                  convo.id === currentId
                    ? "var(--bg-tertiary)"
                    : "transparent",
                border:
                  convo.id === currentId
                    ? "1px solid var(--border-primary)"
                    : "1px solid transparent",
                transition: "all 0.2s",
                marginBottom: 2,
              }}
            >
              <MessageSquare
                size={14}
                style={{
                  color:
                    convo.id === currentId
                      ? "var(--color-primary)"
                      : "var(--text-tertiary)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color:
                    convo.id === currentId
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: convo.id === currentId ? 500 : 400,
                }}
              >
                {convo.title}
              </span>
              {hoveredId === convo.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(convo.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: "none",
                    background: "transparent",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* User Section */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-primary)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {userImage ? (
          <img
            src={userImage}
            alt={userName || "User"}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--bg-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {userName?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {userName || "User"}
        </span>
        <ThemeToggle />
        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid var(--border-primary)",
              background: "var(--bg-tertiary)",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            title="Sign out"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
              e.currentTarget.style.borderColor = "var(--border-primary)";
            }}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
