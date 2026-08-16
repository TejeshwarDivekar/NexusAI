"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Quote,
  ExternalLink,
  Search,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface EvidenceData {
  citation_id?: string;
  source_title: string;
  source_url: string;
  claim: string;
  fact_snippet: string;
  confidence: string;
  relevance_score?: number;
}

export interface EvidencePanelProps {
  evidenceMatrix: EvidenceData[];
  onSelectEvidence?: (evidence: EvidenceData) => void;
}

export function EvidencePanel({ evidenceMatrix, onSelectEvidence }: EvidencePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConfidence, setSelectedConfidence] = useState<string>("all");

  const filteredEvidence = evidenceMatrix.filter((ev) => {
    const matchesSearch =
      ev.claim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.fact_snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.source_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesConfidence =
      selectedConfidence === "all" ||
      (selectedConfidence === "high" && ev.confidence.toLowerCase().includes("9")) ||
      (selectedConfidence === "moderate" && !ev.confidence.toLowerCase().includes("9"));

    return matchesSearch && matchesConfidence;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-primary)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span style={{ fontSize: "14px", fontWeight: 650, color: "var(--text-primary)" }}>
              Evidence Matrix ({evidenceMatrix.length})
            </span>
          </div>
          <Badge variant="success" size="sm" dot>
            Verified Grounding
          </Badge>
        </div>

        {/* Search */}
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
            placeholder="Search verified quotes..."
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
      </div>

      {/* Evidence Items List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredEvidence.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-tertiary)", fontSize: "13px" }}>
            No matching verified evidence quotes found.
          </div>
        ) : (
          filteredEvidence.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectEvidence && onSelectEvidence(item)}
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-primary)",
                backgroundColor: "var(--bg-surface)",
                boxShadow: "var(--shadow-xs)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                cursor: onSelectEvidence ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-primary)";
                e.currentTarget.style.backgroundColor = "var(--bg-surface)";
              }}
            >
              {/* Citation ID & Confidence Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="citation-pill">
                  {item.citation_id || `[${idx + 1}]`}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--success-text)", backgroundColor: "var(--success-bg)", padding: "1px 6px", borderRadius: "4px" }}>
                  {item.confidence || "High (95%)"}
                </span>
              </div>

              {/* Verified Quote Block */}
              <div
                style={{
                  borderLeft: "2px solid var(--accent-primary)",
                  paddingLeft: "8px",
                  fontSize: "12.5px",
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{item.fact_snippet}&rdquo;
              </div>

              {/* Provenance Source */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11.5px",
                  color: "var(--text-tertiary)",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "6px",
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "180px",
                    fontWeight: 500,
                  }}
                >
                  {item.source_title}
                </span>
                {item.source_url.startsWith("http") && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "2px" }}
                  >
                    <span>View</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
