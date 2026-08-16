"use client";

import React from "react";
import { AlertTriangle, GitCompare, HelpCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface ContradictionData {
  claim_a_text: string;
  claim_b_text: string;
  conflict_rationale: string;
  severity?: "potential" | "direct_conflict" | "methodological_divergence" | string;
  source_a?: string;
  source_b?: string;
}

export interface ContradictionViewerProps {
  contradictions: ContradictionData[];
}

export function ContradictionViewer({ contradictions }: ContradictionViewerProps) {
  if (contradictions.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-subtle)",
          border: "1px solid var(--border-primary)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <CheckCircle2 size={20} color="var(--success)" />
        <div>
          <h5 style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
            High Cross-Source Consensus
          </h5>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
            No critical experimental contradictions detected across indexed peer-reviewed literature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <AlertTriangle size={16} color="var(--warning)" />
        <span style={{ fontSize: "14px", fontWeight: 650, color: "var(--text-primary)" }}>
          Identified Potential Divergences & Conflicting Claims ({contradictions.length})
        </span>
      </div>

      {contradictions.map((c, i) => (
        <div
          key={i}
          style={{
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-primary)",
            backgroundColor: "var(--bg-surface)",
            boxShadow: "var(--shadow-xs)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Header Badge */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Badge
              variant={c.severity === "direct_conflict" ? "danger" : "warning"}
              size="sm"
              icon={<GitCompare size={12} />}
            >
              {c.severity === "direct_conflict"
                ? "Direct Disagreement"
                : c.severity === "methodological_divergence"
                ? "Methodological Divergence"
                : "Potential Conflict"}
            </Badge>
          </div>

          {/* Rationale */}
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {c.conflict_rationale}
          </div>

          {/* Side-by-Side Claims Comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                padding: "10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-subtle)",
                borderLeft: "3px solid var(--accent-primary)",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "4px" }}>
                Claim A ({c.source_a || "Source A"})
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                &ldquo;{c.claim_a_text}&rdquo;
              </div>
            </div>

            <div
              style={{
                padding: "10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-subtle)",
                borderLeft: "3px solid var(--warning)",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "4px" }}>
                Claim B ({c.source_b || "Source B"})
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                &ldquo;{c.claim_b_text}&rdquo;
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
