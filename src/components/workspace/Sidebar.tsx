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
  ExternalLink,
  History,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export type WorkspaceTab = "launchpad" | "workspace" | "projects" | "sources" | "reports";

export interface ProjectSummary {
  id: number;
  title: string;
  description?: string;
  questionCount?: number;
}

export interface SidebarProps {
  currentTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  projects: ProjectSummary[];
  selectedProjectId: number | null;
  onSelectProject: (id: number) => void;
  onOpenUpload: () => void;
  onNewProject: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenUpload,
  onNewProject,
}: SidebarProps) {
  const mainNavItems = [
    { id: "launchpad" as WorkspaceTab, label: "Launchpad", icon: <Compass size={17} /> },
    { id: "workspace" as WorkspaceTab, label: "Research Room", icon: <FileSearch size={17} /> },
    { id: "projects" as WorkspaceTab, label: "Projects", icon: <FolderKanban size={17} />, badge: projects.length },
    { id: "sources" as WorkspaceTab, label: "Sources & Docs", icon: <Layers size={17} /> },
    { id: "reports" as WorkspaceTab, label: "Reports Archive", icon: <FileText size={17} /> },
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? "60px" : "240px",
        height: "100%",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-primary)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Top Header & Brand */}
      <div>
        <div
          style={{
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: isCollapsed ? "0" : "0 16px",
            borderBottom: "1px solid var(--border-primary)",
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
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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

        {/* Main Navigation Items */}
        <div style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {mainNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
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
                  fontSize: "13.5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
                {!isCollapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "1px 5px",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: "var(--bg-muted)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Projects Section */}
        {!isCollapsed && (
          <div style={{ padding: "12px 12px 6px 12px" }}>
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
                Active Projects
              </span>
              <button
                onClick={onNewProject}
                aria-label="New Project"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
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

            <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "180px", overflowY: "auto" }}>
              {projects.length === 0 ? (
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", padding: "4px 6px" }}>
                  No projects created
                </span>
              ) : (
                projects.map((p) => {
                  const isSelected = selectedProjectId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectProject(p.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        backgroundColor: isSelected ? "var(--bg-subtle)" : "transparent",
                        color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: isSelected ? 600 : 450,
                        fontSize: "12.5px",
                        textAlign: "left",
                        cursor: "pointer",
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: isSelected ? "var(--accent-primary)" : "var(--border-secondary)",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.title}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border-primary)" }}>
        <button
          onClick={onOpenUpload}
          title={isCollapsed ? "Upload Documents" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "10px",
            width: "100%",
            padding: isCollapsed ? "8px 0" : "8px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-subtle)",
            color: "var(--text-primary)",
            fontSize: "13px",
            fontWeight: 550,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-subtle)")}
        >
          <UploadCloud size={16} color="var(--accent-primary)" />
          {!isCollapsed && <span>Upload Papers & Docs</span>}
        </button>
      </div>
    </aside>
  );
}
