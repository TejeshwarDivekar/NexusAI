"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Search,
  Brain,
  Layers,
  ShieldCheck,
  FileText,
  AlertTriangle,
  FileCheck2,
  Info,
} from "lucide-react";

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
    { id: 1, label: "Query Analysis & Intent Decomposition", threshold: 10, icon: <Brain size={14} /> },
    { id: 2, label: "Real Data Search across arXiv, Wikipedia, PubMed & Registries", threshold: 25, icon: <Search size={14} /> },
    { id: 3, label: "Source Authority Ranking & Deduplication", threshold: 45, icon: <Layers size={14} /> },
    { id: 4, label: "Verified Evidence & Character Quote Extraction", threshold: 65, icon: <FileText size={14} /> },
    { id: 5, label: "Fact Grounding & Anti-Fabrication Verification", threshold: 78, icon: <ShieldCheck size={14} /> },
    { id: 6, label: "Contradiction & Methodological Conflict Audit", threshold: 88, icon: <AlertTriangle size={14} /> },
    { id: 7, label: "Synthesis Engine & Two-Level Simple Report Generation", threshold: 95, icon: <CheckCircle2 size={14} /> },
    { id: 8, label: "Automated IEEE Word Document (.docx) Compilation", threshold: 99, icon: <FileCheck2 size={14} /> },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
      }}
    >
      {/* Progress Bar & Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Loader2 size={18} color="var(--accent-primary)" className="animate-spin" />
            <span style={{ fontSize: "14.5px", fontWeight: 650, color: "var(--text-primary)" }}>
              Executing Real Research Pipeline
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
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

        {/* Current Step Description */}
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px", lineHeight: 1.4 }}>
          {currentStepDescription || "Investigating scientific databases and registries..."}
        </div>
      </div>

      {/* Background execution callout */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--accent-subtle)",
          border: "1px solid var(--accent-border)",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          fontSize: "12.5px",
          color: "var(--text-primary)",
          lineHeight: 1.45,
        }}
      >
        <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <span style={{ fontWeight: 650 }}>Research continues on the server.</span> You can leave this page or switch tabs; your research session is saved automatically.
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
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: isCurrent ? "var(--bg-subtle)" : "transparent",
                color: isDone ? "var(--text-primary)" : isCurrent ? "var(--accent-primary)" : "var(--text-tertiary)",
                fontSize: "13px",
                fontWeight: isCurrent ? 600 : 500,
                transition: "all 0.15s ease",
              }}
            >
              {isDone ? (
                <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
              ) : isCurrent ? (
                <Loader2 size={16} color="var(--accent-primary)" className="animate-spin" style={{ flexShrink: 0 }} />
              ) : (
                <Circle size={16} color="var(--border-secondary)" style={{ flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, lineHeight: 1.35 }}>{stage.label}</span>
              {isDone && <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>✓ Done</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
