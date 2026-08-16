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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface SourceData {
  title: string;
  url: string;
  snippet: string;
  source_type: string;
  reliability: number;
  authors?: string[];
  publication_date?: string | null;
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

  const filteredSources = sources.filter((s) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "academic" && s.source_type.startsWith("academic")) ||
      (filterType === "web" && s.source_type === "web") ||
      (filterType === "document" && s.source_type === "user_document");

    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.snippet.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  const toggleSelect = (url: string) => {
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-primary)",
        overflow: "hidden",
      }}
    >
      {/* Header & Controls */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: "10px" }}>
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
              size="xs"
              leftIcon={<BarChart2 size={12} />}
              onClick={handleCompareClick}
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
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <Search size={13} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Filter indexed sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "12.5px",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Type Filter Pills */}
        <div style={{ display: "flex", gap: "4px", overflowX: "auto" }}>
          {[
            { id: "all", label: "All" },
            { id: "academic", label: "Academic" },
            { id: "web", label: "Web" },
            { id: "document", label: "Documents" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontSize: "11.5px",
                fontWeight: filterType === tab.id ? 600 : 500,
                border: "none",
                cursor: "pointer",
                backgroundColor: filterType === tab.id ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: filterType === tab.id ? "#FFFFFF" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {filteredSources.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-tertiary)", fontSize: "13px" }}>
            No sources found.
          </div>
        ) : (
          filteredSources.map((source, index) => {
            const isSelected = selectedUrls.has(source.url);
            const isAcademic = source.source_type.startsWith("academic");
            const isDoc = source.source_type === "user_document";

            return (
              <div
                key={index}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-primary)"}`,
                  backgroundColor: isSelected ? "var(--accent-subtle)" : "var(--bg-surface)",
                  boxShadow: "var(--shadow-xs)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Top Badge & Compare Checkbox */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Badge
                    variant={isAcademic ? "accent" : isDoc ? "success" : "neutral"}
                    size="sm"
                    icon={isAcademic ? <BookOpen size={11} /> : isDoc ? <FileText size={11} /> : <Globe size={11} />}
                  >
                    {isAcademic ? "arXiv / PubMed" : isDoc ? "User Document" : "Web Reference"}
                  </Badge>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={() => toggleSelect(source.url)}
                      title="Select for source comparison"
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "var(--radius-xs)",
                        border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-secondary)"}`,
                        backgroundColor: isSelected ? "var(--accent-primary)" : "var(--bg-surface)",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {isSelected && <Check size={12} />}
                    </button>

                    {source.url.startsWith("http") && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--text-tertiary)", display: "flex", alignItems: "center" }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    lineHeight: 1.4,
                  }}
                >
                  {source.title}
                </h4>

                {/* Snippet */}
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {source.snippet}
                </p>

                {/* Metadata Footer: Reliability & Authors */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "var(--text-tertiary)",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span>
                    {source.authors && source.authors.length > 0
                      ? source.authors[0] + (source.authors.length > 1 ? " et al." : "")
                      : source.publication_date || "Indexed 2026"}
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--accent-primary)" }}>
                    {Math.round((source.reliability || 0.85) * 100)}% Authority
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
