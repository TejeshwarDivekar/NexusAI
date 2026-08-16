"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  FolderKanban,
  FileText,
  UploadCloud,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewResearch: () => void;
  onOpenProjects: () => void;
  onOpenUpload: () => void;
  onViewSources: () => void;
  onViewReports: () => void;
  onSelectQuery: (query: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNewResearch,
  onOpenProjects,
  onOpenUpload,
  onViewSources,
  onViewReports,
  onSelectQuery,
}: CommandPaletteProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen]);

  const commandGroups = [
    {
      group: "Primary Actions",
      items: [
        {
          id: "new_research",
          label: "Start New Research",
          desc: "Initialize a multi-agent deep research investigation",
          icon: <Plus size={15} color="var(--accent-primary)" />,
          action: () => {
            onClose();
            onNewResearch();
          },
        },
        {
          id: "upload_docs",
          label: "Upload Papers & Documents",
          desc: "Ingest and chunk PDF / Text documents into vector index",
          icon: <UploadCloud size={15} color="var(--info)" />,
          action: () => {
            onClose();
            onOpenUpload();
          },
        },
        {
          id: "manage_projects",
          label: "Manage Research Projects",
          desc: "Create and organize research questions and objectives",
          icon: <FolderKanban size={15} color="var(--warning)" />,
          action: () => {
            onClose();
            onOpenProjects();
          },
        },
      ],
    },
    {
      group: "Quick Investigation Prompts",
      items: [
        {
          id: "q_rag",
          label: "State of the Art in Retrieval-Augmented Generation",
          desc: "Query arXiv and web sources for dense retrieval architectures",
          icon: <Sparkles size={15} color="var(--accent-primary)" />,
          action: () => {
            onClose();
            onSelectQuery("State of the Art in Retrieval-Augmented Generation architectures with HNSW vector indices");
          },
        },
        {
          id: "q_quantum",
          label: "Quantum Error Correction Thresholds",
          desc: "Surface empirical benchmark metrics on surface code architectures",
          icon: <Sparkles size={15} color="var(--accent-primary)" />,
          action: () => {
            onClose();
            onSelectQuery("Fault-tolerant quantum error correction thresholds in superconducting qubits");
          },
        },
        {
          id: "q_bio",
          label: "CRISPR-Cas9 Off-Target Minimization",
          desc: "Extract bioRxiv/PubMed findings on high-fidelity Cas variants",
          icon: <Sparkles size={15} color="var(--accent-primary)" />,
          action: () => {
            onClose();
            onSelectQuery("Recent engineering strategies for high-fidelity CRISPR-Cas9 off-target minimization");
          },
        },
      ],
    },
    {
      group: "Navigation",
      items: [
        {
          id: "nav_sources",
          label: "Browse Sources & Evidence",
          desc: "Inspect indexed literature and reliability metrics",
          icon: <Layers size={15} color="var(--text-secondary)" />,
          action: () => {
            onClose();
            onViewSources();
          },
        },
        {
          id: "nav_reports",
          label: "View Research Reports",
          desc: "Access structured executive reports with citation indices",
          icon: <FileText size={15} color="var(--text-secondary)" />,
          action: () => {
            onClose();
            onViewReports();
          },
        },
      ],
    },
  ];

  const filteredGroups = commandGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="580px">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "-4px 0" }}>
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <Search size={16} color="var(--text-tertiary)" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, question, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "var(--text-primary)",
            }}
          />
          <span
            style={{
              padding: "1px 5px",
              borderRadius: "4px",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-tertiary)",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              border: "1px solid var(--border-primary)",
            }}
          >
            ESC
          </span>
        </div>

        {/* Action List */}
        <div style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredGroups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: "var(--text-tertiary)", fontSize: "13px" }}>
              No commands matching &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredGroups.map((g, idx) => (
              <div key={idx}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 650,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-tertiary)",
                    marginBottom: "6px",
                    paddingLeft: "4px",
                  }}
                >
                  {g.group}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid transparent",
                        backgroundColor: "transparent",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "all 0.15s ease",
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
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-subtle)",
                          border: "1px solid var(--border-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 550, color: "var(--text-primary)" }}>
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-tertiary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                      <ArrowRight size={14} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
