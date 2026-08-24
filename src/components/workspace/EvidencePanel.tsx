"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Quote,
  ExternalLink,
  Search,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  FileText,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface EvidenceData {
  citation_id?: string;
  source_title: string;
  source_url: string;
  claim: string;
  fact_snippet: string;
  confidence: string;
  why_relevant?: string;
  query_relevance?: string;
  relevance_score?: number;
  source_authors?: string[];
  source_year?: number | string;
  source_publisher?: string;
  source_doi?: string;
}

export interface EvidencePanelProps {
  evidenceMatrix: EvidenceData[];
  activeCitationId?: string | null;
  activeEvidence?: EvidenceData | null;
  onSelectEvidence?: (evidence: EvidenceData) => void;
}

export function EvidencePanel({
  evidenceMatrix,
  activeCitationId,
  activeEvidence,
  onSelectEvidence,
}: EvidencePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const filteredEvidence = evidenceMatrix.filter((ev) => {
    const matchesSearch =
      ev.claim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.fact_snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.source_title.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Auto-scroll to selected citation when clicked from center answer
  useEffect(() => {
    if (activeCitationId) {
      const cleanId = activeCitationId.replace(/[^0-9]/g, "");
      const targetElement = itemRefs.current[cleanId];
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeCitationId]);

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
      {/* Header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
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
            placeholder="Search verified quotes & claims..."
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
      </div>

      {/* Evidence Items List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {filteredEvidence.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-tertiary)", fontSize: "13.5px" }}>
            {evidenceMatrix.length === 0
              ? "No verified evidence items recorded yet. Run a research inquiry to extract citations."
              : "No matching evidence quotes found."}
          </div>
        ) : (
          filteredEvidence.map((item, idx) => {
            const rawCitationNumber = (item.citation_id || `[${idx + 1}]`).replace(/[^0-9]/g, "");
            const isSelected = !!activeEvidence && (
              (activeEvidence.citation_id && item.citation_id && activeEvidence.citation_id === item.citation_id) ||
              (activeEvidence.claim && item.claim && activeEvidence.claim === item.claim)
            );
            const isHighlighted = isSelected || Boolean(activeCitationId && activeCitationId.replace(/[^0-9]/g, "") === rawCitationNumber);

            return (
              <div
                key={idx}
                ref={(el) => { itemRefs.current[rawCitationNumber] = el; }}
                onClick={() => onSelectEvidence && onSelectEvidence(item)}
                style={{
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${isSelected ? "var(--accent-primary)" : isHighlighted ? "var(--accent-primary)" : "var(--border-primary)"}`,
                  backgroundColor: isSelected ? "var(--accent-subtle)" : isHighlighted ? "var(--bg-subtle)" : "var(--bg-surface)",
                  boxShadow: isSelected ? "0 0 0 3px rgba(37, 99, 235, 0.2)" : isHighlighted ? "0 0 0 2px rgba(37, 99, 235, 0.1)" : "var(--shadow-xs)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  cursor: onSelectEvidence ? "pointer" : "default",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isHighlighted && !isSelected) {
                    e.currentTarget.style.borderColor = "var(--border-secondary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isHighlighted && !isSelected) {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-surface)";
                  }
                }}
              >
                {/* Citation ID Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      className="citation-pill"
                      style={{
                        backgroundColor: isSelected ? "var(--accent-primary)" : isHighlighted ? "var(--accent-primary)" : "var(--accent-subtle)",
                        color: isSelected ? "#FFFFFF" : isHighlighted ? "#FFFFFF" : "var(--accent-primary)",
                        fontWeight: 700,
                      }}
                    >
                      {item.citation_id || `[${idx + 1}]`}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        • Inspecting
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 650,
                      color: item.confidence === "High" ? "var(--success-text)" : "var(--accent-primary)",
                      backgroundColor: item.confidence === "High" ? "var(--success-bg)" : "var(--accent-subtle)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      border: `1px solid ${item.confidence === "High" ? "var(--success-border)" : "var(--accent-subtle)"}`,
                    }}
                  >
                    Confidence: {item.confidence || "High"}
                  </span>
                </div>

                {/* Research Claim */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Claim
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                    {item.claim}
                  </div>
                </div>

                {/* Why Relevant */}
                {item.why_relevant && (
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                    <span style={{ fontWeight: 650, color: "var(--accent-primary)" }}>Why Relevant: </span>
                    {item.why_relevant}
                  </div>
                )}

                {/* Grounded Excerpt */}
                <div
                  style={{
                    borderLeft: "3px solid var(--accent-primary)",
                    paddingLeft: "10px",
                    paddingTop: "2px",
                    paddingBottom: "2px",
                    backgroundColor: "var(--bg-subtle)",
                    borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 650, color: "var(--accent-primary)", marginBottom: "4px" }}>
                    Evidence Excerpt
                  </div>
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.45, margin: 0, fontStyle: "italic" }}>
                    "{item.fact_snippet}"
                  </p>
                </div>

                {/* Source Link */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                    {item.source_title}
                  </span>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "var(--accent-primary)",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <span>View Source</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
