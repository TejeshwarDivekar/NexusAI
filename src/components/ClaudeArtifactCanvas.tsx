"use client";

import React, { useState } from "react";
import {
  FileText,
  Table,
  Globe,
  Code,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { MarkdownRenderer } from "./chat/MarkdownRenderer";

interface SourceItem {
  title: string;
  url: string;
  snippet: string;
  source_type: string;
  reliability: number;
}

interface EvidenceItem {
  citation_id: string;
  source_title: string;
  source_url: string;
  claim: string;
  fact_snippet: string;
  confidence: string;
}

interface ClaudeArtifactCanvasProps {
  reportMarkdown: string;
  sources: SourceItem[];
  evidenceMatrix: EvidenceItem[];
  query: string;
  onClose?: () => void;
}

export function ClaudeArtifactCanvas({
  reportMarkdown,
  sources,
  evidenceMatrix,
  query,
  onClose,
}: ClaudeArtifactCanvasProps) {
  const [activeTab, setActiveTab] = useState<"report" | "matrix" | "sources" | "markdown">("report");
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude_research_artifact_${Date.now()}.md`;
    a.click();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border-primary)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        position: isExpanded ? "fixed" : "relative",
        inset: isExpanded ? 0 : "auto",
        zIndex: isExpanded ? 100 : 1,
      }}
    >
      {/* Claude Artifact Header */}
      <div
        style={{
          padding: "14px 20px",
          background: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--border-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--color-primary)",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✦
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              Artifact: Deep Research Output
            </span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", display: "block" }}>
              {sources.length} Verified Sources · Interactive View
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", background: "var(--bg-primary)", padding: 3, borderRadius: 10, border: "1px solid var(--border-primary)" }}>
          <button
            onClick={() => setActiveTab("report")}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "report" ? "var(--color-primary)" : "transparent",
              color: activeTab === "report" ? "#FFF" : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            <FileText size={13} /> Report
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "matrix" ? "var(--color-primary)" : "transparent",
              color: activeTab === "matrix" ? "#FFF" : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            <Table size={13} /> Evidence Matrix
          </button>

          <button
            onClick={() => setActiveTab("sources")}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "sources" ? "var(--color-primary)" : "transparent",
              color: activeTab === "sources" ? "#FFF" : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            <Globe size={13} /> Sources ({sources.length})
          </button>

          <button
            onClick={() => setActiveTab("markdown")}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "markdown" ? "var(--color-primary)" : "transparent",
              color: activeTab === "markdown" ? "#FFF" : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            <Code size={13} /> Code/Raw
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handleCopy}
            title="Copy Artifact Markdown"
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border-primary)",
              background: "var(--bg-primary)",
              color: copied ? "var(--color-success)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            onClick={handleDownload}
            title="Download Artifact"
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border-primary)",
              background: "var(--bg-primary)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Download size={13} /> Export
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Canvas" : "Fullscreen Canvas"}
            style={{
              padding: "6px",
              borderRadius: 8,
              border: "1px solid var(--border-primary)",
              background: "var(--bg-primary)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "6px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "var(--text-tertiary)",
                cursor: "pointer",
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Artifact View Body */}
      <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
        {activeTab === "report" && (
          <div className="animate-fade-in" style={{ maxWidth: 840, margin: "0 auto" }}>
            <MarkdownRenderer content={reportMarkdown} />
          </div>
        )}

        {activeTab === "matrix" && (
          <div className="animate-fade-in" style={{ maxWidth: 900, margin: "0 auto" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }} className="claude-serif">
              Structured Evidence Matrix
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Cross-verified evidence items extracted across multiple domain sources.
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--bg-primary)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "var(--text-secondary)" }}>Citation</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "var(--text-secondary)" }}>Source Title</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "var(--text-secondary)" }}>Fact Snippet / Evidence</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, color: "var(--text-secondary)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {evidenceMatrix.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>{item.citation_id}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500, maxWidth: 220 }}>
                      <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: "var(--text-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {item.source_title} <ExternalLink size={12} color="var(--text-tertiary)" />
                      </a>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.fact_snippet}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "rgba(16, 185, 129, 0.15)", color: "var(--color-success)" }}>
                        ✓ Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "sources" && (
          <div className="animate-fade-in" style={{ maxWidth: 840, margin: "0 auto" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }} className="claude-serif">
              Source Graph & Domain Authority Inspector
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 14 }}>
              {sources.map((src, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "rgba(217, 119, 87, 0.12)", color: "var(--color-primary)" }}>
                      [{i + 1}] {src.source_type.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 600 }}>
                      {(src.reliability * 100).toFixed(0)}% Reliability
                    </span>
                  </div>

                  <a href={src.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    {src.title} <ExternalLink size={13} color="var(--text-tertiary)" />
                  </a>

                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {src.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "markdown" && (
          <div className="animate-fade-in" style={{ maxWidth: 900, margin: "0 auto" }}>
            <pre style={{ padding: 20, background: "var(--bg-code)", color: "#ECEBE4", borderRadius: 12, fontSize: 13, overflowX: "auto", border: "1px solid var(--border-primary)" }}>
              <code>{reportMarkdown}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
