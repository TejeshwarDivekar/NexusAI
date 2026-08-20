"use client";

import React from "react";
import {
  Compass,
  FileSearch,
  FolderKanban,
  FileText,
  Layers,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  X,
  Trash2,
  MessageSquare,
} from "lucide-react";

export type WorkspaceTab = "launchpad" | "workspace" | "projects" | "sources" | "reports";

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  task_count?: number;
  last_message?: string;
  date_group?: string;
}

export interface SidebarProps {
  currentTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onOpenUpload: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onOpenUpload,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const mainNavItems = [
    { id: "launchpad" as WorkspaceTab, label: "Launchpad", icon: <Compass size={17} /> },
    { id: "workspace" as WorkspaceTab, label: "Research Room", icon: <FileSearch size={17} /> },
    { id: "projects" as WorkspaceTab, label: "Projects", icon: <FolderKanban size={17} /> },
    { id: "sources" as WorkspaceTab, label: "Sources & Docs", icon: <Layers size={17} /> },
    { id: "reports" as WorkspaceTab, label: "Reports Archive", icon: <FileText size={17} /> },
  ];

  const handleTabClick = (tab: WorkspaceTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const handleConvoClick = (id: string) => {
    onSelectConversation(id);
    if (onCloseMobile) onCloseMobile();
  };

  // Group conversations by date
  const groups: Record<string, ConversationSummary[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  conversations.forEach((c) => {
    const grp = c.date_group || "Today";
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(c);
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md-hide"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 40,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <aside
        className={`sidebar-root ${isMobileOpen ? "mobile-open" : ""}`}
        style={{
          width: isCollapsed ? "60px" : "240px",
          height: "100%",
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border-primary)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
          flexShrink: 0,
          zIndex: 50,
        }}
      >
        {/* Top Header & Brand */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div
            style={{
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "space-between",
              padding: isCollapsed ? "0" : "0 16px",
              borderBottom: "1px solid var(--border-primary)",
              flexShrink: 0,
            }}
          >
            {!isCollapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <span style={{ fontSize: "14.5px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Nexus<span style={{ color: "var(--accent-primary)" }}>Research</span>
                </span>
              </div>
            )}

            {/* Desktop Collapse / Mobile Close */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {onCloseMobile && isMobileOpen && (
                <button
                  onClick={onCloseMobile}
                  aria-label="Close sidebar"
                  className="md-hide"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              )}

              <button
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="mobile-hide"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid transparent",
                  background: "transparent",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          </div>

          {/* Main Navigation Items */}
          <div style={{ padding: "10px 8px 6px 8px", display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
            {mainNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    gap: "10px",
                    width: "100%",
                    padding: isCollapsed ? "8px 0" : "8px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid transparent",
                    backgroundColor: isActive ? "var(--bg-subtle)" : "transparent",
                    color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    minHeight: "38px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <div style={{ color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
                    {item.icon}
                  </div>
                  {!isCollapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Real User Conversation History */}
          {!isCollapsed && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                padding: "8px 12px",
                borderTop: "1px solid var(--border-primary)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 650,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-tertiary)",
                  }}
                >
                  Recent History
                </span>
                <button
                  onClick={() => {
                    onNewConversation();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title="New Research Inquiry"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "22px",
                    height: "22px",
                    borderRadius: "var(--radius-xs)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                >
                  <Plus size={14} />
                </button>
              </div>

              {conversations.length === 0 ? (
                <div style={{ padding: "8px 4px", fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                  No conversations yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(["Today", "Yesterday", "Older"] as const).map((groupName) => {
                    const items = groups[groupName] || [];
                    if (items.length === 0) return null;

                    return (
                      <div key={groupName} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            padding: "2px 6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {groupName}
                        </div>
                        {items.map((c) => {
                          const isSelected = activeConversationId === c.id;
                          return (
                            <div
                              key={c.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: isSelected ? "var(--bg-subtle)" : "transparent",
                                color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                                padding: "2px 4px",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <button
                                onClick={() => handleConvoClick(c.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "6px 4px",
                                  border: "none",
                                  background: "transparent",
                                  color: "inherit",
                                  fontSize: "12.5px",
                                  fontWeight: isSelected ? 600 : 450,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  flex: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  minHeight: "32px",
                                }}
                              >
                                <MessageSquare
                                  size={13}
                                  color={isSelected ? "var(--accent-primary)" : "var(--text-tertiary)"}
                                  style={{ flexShrink: 0 }}
                                />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {c.title}
                                </span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(c.id);
                                }}
                                title="Delete Conversation"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "var(--radius-xs)",
                                  border: "none",
                                  background: "transparent",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  opacity: isSelected ? 1 : 0.6,
                                  flexShrink: 0,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = "var(--danger)";
                                  e.currentTarget.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = "var(--text-muted)";
                                  e.currentTarget.style.opacity = isSelected ? "1" : "0.6";
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border-primary)", flexShrink: 0 }}>
          <button
            onClick={() => {
              onOpenUpload();
              if (onCloseMobile) onCloseMobile();
            }}
            title={isCollapsed ? "Upload Documents" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: "10px",
              width: "100%",
              padding: isCollapsed ? "10px 0" : "10px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-primary)",
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontWeight: 550,
              cursor: "pointer",
              minHeight: "44px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
          >
            <UploadCloud size={16} color="var(--accent-primary)" />
            {!isCollapsed && <span>Upload Papers & Docs</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
