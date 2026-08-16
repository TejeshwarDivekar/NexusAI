"use client";

import React from "react";
import { CheckCircle2, Circle, Loader2, Search, Brain, Layers, ShieldCheck, FileText, AlertTriangle, FileCheck2 } from "lucide-react";

export interface ResearchProgressProps {
  progressPercentage: number;
  currentStepDescription: string;
  subQueries?: string[];
  sourcesCount?: number;
}

export function ResearchProgress({
  progressPercentage,
  currentStepDescription,
  subQueries = [],
  sourcesCount = 0,
}: ResearchProgressProps) {
  const stages = [
    { id: 1, label: "Query Analysis & Target Decomposition", threshold: 10, icon: <Brain size={14} /> },
    { id: 2, label: "Multi-Source Search across arXiv, PubMed & Web", threshold: 25, icon: <Search size={14} /> },
    { id: 3, label: "Source Authority Ranking & Deduplication", threshold: 45, icon: <Layers size={14} /> },
    { id: 4, label: "Document Chunking & Verified Quote Extraction", threshold: 65, icon: <FileText size={14} /> },
    { id: 5, label: "Claim Grounding & Provenance Verification", threshold: 78, icon: <ShieldCheck size={14} /> },
    { id: 6, label: "Contradiction & Methodological Conflict Audit", threshold: 88, icon: <AlertTriangle size={14} /> },
    { id: 7, label: "Synthesis Engine & Exact Citation Mapping", threshold: 95, icon: <CheckCircle2 size={14} /> },
    { id: 8, label: "Automated IEEE Word Document (.docx) Generation", threshold: 99, icon: <FileCheck2 size={14} /> },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Progress Bar & Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Loader2 size={16} color="var(--accent-primary)" className="animate-spin" />
            <span style={{ fontSize: "14px", fontWeight: 650, color: "var(--text-primary)" }}>
              Deterministic Research Pipeline Active
            </span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 650, color: "var(--accent-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
            {progressPercentage}%
          </span>
        </div>

        {/* Bar */}
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "var(--radius-full)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercentage}%`,
              backgroundColor: "var(--accent-primary)",
              borderRadius: "var(--radius-full)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Stage Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
        {stages.map((stage) => {
          const isDone = progressPercentage >= stage.threshold;
          const isCurrent =
            progressPercentage < stage.threshold &&
            (stage.id === 1 || progressPercentage >= (stages[stage.id - 2]?.threshold || 0));

          return (
            <div
              key={stage.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: isCurrent ? "var(--bg-subtle)" : "transparent",
                color: isDone ? "var(--text-primary)" : isCurrent ? "var(--accent-primary)" : "var(--text-tertiary)",
                fontSize: "13px",
                fontWeight: isCurrent ? 600 : 500,
                transition: "all 0.15s ease",
              }}
            >
              {isDone ? (
                <CheckCircle2 size={15} color="var(--success)" />
              ) : isCurrent ? (
                <Loader2 size={15} color="var(--accent-primary)" className="animate-spin" />
              ) : (
                <Circle size={15} color="var(--border-secondary)" />
              )}
              <span style={{ flex: 1 }}>{stage.label}</span>
              {isDone && <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>✓ Completed</span>}
            </div>
          );
        })}
      </div>

      {/* Live Active Sub-queries & Sources Status */}
      {subQueries.length > 0 && (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", marginBottom: "6px" }}>
            Active Query Targets ({subQueries.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {subQueries.map((sq, i) => (
              <div key={i} style={{ fontSize: "12.5px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--accent-primary)" }} />
                <span>{sq}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
