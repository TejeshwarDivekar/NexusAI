"use client";

import React, { useState } from "react";
import {
  Layers,
  Search,
  BookOpen,
  Globe,
  FileText,
  ExternalLink,
  Check,
  BarChart2,
  Filter,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface SourceData {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  source_type: string;
  reliability: number;
  authors?: string[];
  publication_date?: string | null;
  doi?: string;
}

export interface SourcesPanelProps {
  sources: SourceData[];
  onSelectSource?: (source: SourceData) => void;
  onOpenCompare?: (selectedSources: SourceData[]) => void;
}

export function SourcesPanel({ sources, onSelectSource, onOpenCompare }: SourcesPanelProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [activeSourceDetail, setActiveSourceDetail] = useState<SourceData | null>(null);

  const filteredSources = sources.filter((s) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "academic" && s.source_type.startsWith("academic")) ||
      (filterType === "web" && (s.source_type.includes("web") || s.source_type.includes("encyclopedia"))) ||
      (filterType === "document" && s.source_type === "user_document");

    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.snippet && s.snippet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.authors && s.authors.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())));

    return matchesType && matchesSearch;
  });

  const toggleSelect = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedUrls(next);
  };

  const handleCompareClick = () => {
    if (onOpenCompare) {
      const selected = sources.filter((s) => selectedUrls.has(s.url));
      onOpenCompare(selected.length >= 2 ? selected : sources.slice(0, 3));
    }
  };

  // Render Full Screen Source Detail View
  if (activeSourceDetail) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "var(--bg-surface)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Detail Top Bar */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-surface)",
            flexShrink: 0,
            gap: "8px",
          }}
        >
          <button
            onClick={() => setActiveSourceDetail(null)}
            className="touch-target"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-primary)",
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-primary)",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Sources</span>
          </button>

          <a
            href={activeSourceDetail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--accent-primary)",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              minHeight: "44px",
            }}
          >
            <span>Open Source</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Detail Content Canvas */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Badge variant="accent" size="sm">
                {activeSourceDetail.source_type.replace(/_/g, " ").toUpperCase()}
              </Badge>
              <Badge variant="success" size="sm" dot>
                Verified Registry
              </Badge>
            </div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.4,
                marginBottom: "8px",
              }}
            >
              {activeSourceDetail.title}
            </h2>

            {/* Metadata Tags */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
              {activeSourceDetail.authors && activeSourceDetail.authors.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={14} color="var(--text-tertiary)" />
                  <span>{activeSourceDetail.authors.join(", ")}</span>
                </div>
              )}
              {activeSourceDetail.publication_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} color="var(--text-tertiary)" />
                  <span>Publication Year: {activeSourceDetail.publication_date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Abstract / Extracted Excerpt */}
          <div
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 650,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-tertiary)",
                marginBottom: "8px",
              }}
            >
              Extracted Abstract / Document Evidence
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.65,
                color: "var(--text-primary)",
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {activeSourceDetail.content || activeSourceDetail.snippet || "No abstract text available."}
            </p>
          </div>

          {/* Original Reference Identifier */}
          <div
            style={{
              fontSize: "12.5px",
              color: "var(--text-tertiary)",
              wordBreak: "break-all",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Source URL: </span>
            <a
              href={activeSourceDetail.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-primary)", textDecoration: "underline" }}
            >
              {activeSourceDetail.url}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-surface)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Header & Controls */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: "14px", fontWeight: 650, color: "var(--text-primary)" }}>
              Sources ({sources.length})
            </span>
          </div>
          {sources.length >= 2 && onOpenCompare && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BarChart2 size={13} />}
              onClick={handleCompareClick}
              style={{ minHeight: "36px" }}
            >
              Compare ({selectedUrls.size > 0 ? selectedUrls.size : 2})
            </Button>
          )}
        </div>

        {/* Search Filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-subtle)",
            minHeight: "44px",
          }}
        >
          <Search size={15} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search indexed papers, authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "13.5px",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Type Filter Pills */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
          {[
            { id: "all", label: "All" },
            { id: "academic", label: "Academic" },
            { id: "web", label: "Web & News" },
            { id: "document", label: "Documents" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className="touch-target"
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "12.5px",
                fontWeight: filterType === tab.id ? 650 : 500,
                border: "1px solid var(--border-primary)",
                cursor: "pointer",
                backgroundColor: filterType === tab.id ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: filterType === tab.id ? "#FFFFFF" : "var(--text-secondary)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                minHeight: "36px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {filteredSources.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-tertiary)", fontSize: "13.5px" }}>
            No matching sources found in indexed literature.
          </div>
        ) : (
          filteredSources.map((source, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveSourceDetail(source);
                if (onSelectSource) onSelectSource(source);
              }}
              style={{
                padding: "14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-primary)",
                backgroundColor: "var(--bg-surface)",
                boxShadow: "var(--shadow-xs)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-primary)";
                e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.backgroundColor = "var(--bg-surface)";
              }}
            >
              {/* Type Badge & Checkbox */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {source.source_type.startsWith("academic") ? (
                    <BookOpen size={14} color="var(--accent-primary)" />
                  ) : source.source_type === "user_document" ? (
                    <FileText size={14} color="var(--accent-primary)" />
                  ) : (
                    <Globe size={14} color="var(--accent-primary)" />
                  )}
                  <span style={{ fontSize: "11px", fontWeight: 650, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    {source.source_type.replace(/_/g, " ")}
                  </span>
                </div>

                <div
                  onClick={(e) => toggleSelect(source.url, e)}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    border: `1px solid ${selectedUrls.has(source.url) ? "var(--accent-primary)" : "var(--border-secondary)"}`,
                    backgroundColor: selectedUrls.has(source.url) ? "var(--accent-primary)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                  }}
                >
                  {selectedUrls.has(source.url) && <Check size={12} />}
                </div>
              </div>

              {/* Title */}
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.35,
                  margin: 0,
                }}
              >
                {source.title}
              </h4>

              {/* Authors & Year */}
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {source.authors && source.authors.length > 0 && (
                  <span>{source.authors.slice(0, 2).join(", ")}{source.authors.length > 2 ? " et al." : ""}</span>
                )}
                {source.publication_date && <span>• {source.publication_date}</span>}
              </div>

              {/* Excerpt */}
              {source.snippet && (
                <p
                  style={{
                    fontSize: "12.5px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {source.snippet}
                </p>
              )}

              {/* Action link */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-primary)" }}>
                  Tap for Details →
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11.5px",
                    color: "var(--text-tertiary)",
                    textDecoration: "none",
                    padding: "4px",
                  }}
                >
                  <span>Link</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
