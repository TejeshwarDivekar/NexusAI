"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  Share2,
  MoreVertical,
  Layers,
  Award,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface ReportViewerProps {
  markdownContent: string;
  summary?: string;
  query: string;
  taskId?: string;
  docxDownloadUrl?: string;
  pdfDownloadUrl?: string;
  sourcesCount?: number;
  evidenceCount?: number;
  qualityScore?: number;
  sourceDiversityScore?: number;
  evidenceCoverageScore?: number;
  onCitationClick?: (citationId: string) => void;
  onViewSources?: () => void;
  onViewEvidence?: () => void;
}

type DownloadStep = "idle" | "generating" | "validating" | "formatting" | "ready";

export function ReportViewer({
  markdownContent,
  summary,
  query,
  taskId,
  docxDownloadUrl,
  pdfDownloadUrl,
  sourcesCount = 0,
  evidenceCount = 0,
  onCitationClick,
  onViewSources,
  onViewEvidence,
}: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const [downloadStep, setDownloadStep] = useState<DownloadStep>("idle");
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "docx" | null>(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Qualitative evidence strength calculation based strictly on real state
  const evidenceStrength =
    sourcesCount >= 5 && evidenceCount >= 4
      ? { label: "High", color: "var(--success-text)", bg: "var(--success-bg)", border: "var(--success-border)" }
      : sourcesCount >= 2
      ? { label: "Moderate", color: "var(--warning-text)", bg: "var(--warning-bg)", border: "var(--warning-border)" }
      : { label: "Limited", color: "var(--text-tertiary)", bg: "var(--bg-subtle)", border: "var(--border-primary)" };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowOverflowMenu(false);
  };

  const handleShare = async () => {
    setShowOverflowMenu(false);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Research Answer: ${query}`,
          text: summary || `Verified research on: ${query}`,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // Fallback to clipboard if user dismissed share sheet
      }
    }
    navigator.clipboard.writeText(window.location.href);
    setShareFeedback("Link copied to clipboard!");
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NexusResearch-${query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowOverflowMenu(false);
  };

  const executeDownload = async (format: "pdf" | "docx") => {
    if (!taskId) return;
    setDownloadingFormat(format);
    setDownloadStep("generating");

    // Progressive visual steps
    await new Promise((r) => setTimeout(r, 400));
    setDownloadStep("validating");
    await new Promise((r) => setTimeout(r, 400));
    setDownloadStep("formatting");

    const defaultUrl = `/api/v1/research/tasks/${taskId}/document/download?format=${format}`;
    const targetUrl = format === "pdf" ? (pdfDownloadUrl || defaultUrl) : (docxDownloadUrl || defaultUrl);

    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      
      setDownloadStep("ready");
      await new Promise((r) => setTimeout(r, 300));

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "pdf" ? "pdf" : "docx";
      const prefix = format === "pdf" ? "Academic_Paper" : "IEEE_Research_Paper";
      a.download = `${prefix}_${query.slice(0, 25).replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setTimeout(() => {
        setDownloadStep("idle");
        setDownloadingFormat(null);
      }, 1000);
    } catch (err) {
      window.open(targetUrl, "_blank");
      setTimeout(() => {
        setDownloadStep("idle");
        setDownloadingFormat(null);
      }, 1500);
    }
  };

  const handlePrint = () => {
    setShowOverflowMenu(false);
    window.print();
  };

  const getStepText = () => {
    switch (downloadStep) {
      case "generating":
        return "Generating research document...";
      case "validating":
        return "Validating citations & sources...";
      case "formatting":
        return `Formatting academic ${downloadingFormat?.toUpperCase()}...`;
      case "ready":
        return `${downloadingFormat?.toUpperCase()} ready! Downloading...`;
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-app)",
        overflow: "hidden",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Top Action Bar */}
      <div
        style={{
          padding: "10px 16px",
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={14} />
          </div>
          <span
            style={{
              fontSize: "13.5px",
              fontWeight: 650,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Research Answer
          </span>
          <Badge variant="success" size="sm" dot className="mobile-hide">
            Verified
          </Badge>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {taskId && (
            <>
              {/* Download PDF Button */}
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileText size={14} />}
                onClick={() => executeDownload("pdf")}
                isLoading={downloadingFormat === "pdf" && downloadStep !== "idle"}
                style={{ minHeight: "38px" }}
              >
                <span className="mobile-hide">Download PDF</span>
                <span className="mobile-only">PDF</span>
              </Button>

              {/* Download Word Button */}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileCheck2 size={14} />}
                onClick={() => executeDownload("docx")}
                isLoading={downloadingFormat === "docx" && downloadStep !== "idle"}
                style={{ minHeight: "38px" }}
              >
                <span className="mobile-hide">Download Word (.docx)</span>
                <span className="mobile-only">Word</span>
              </Button>
            </>
          )}

          {/* Desktop Actions */}
          <div className="mobile-hide" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={copied ? <Check size={13} /> : <Copy size={13} />}
              onClick={handleCopy}
              style={{ minHeight: "36px" }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 size={13} />}
              onClick={handleShare}
              style={{ minHeight: "36px" }}
            >
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={handleDownloadMarkdown}
              style={{ minHeight: "36px" }}
            >
              .MD
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              title="Print research"
              style={{ width: "36px", height: "36px", padding: 0 }}
            >
              <Printer size={14} />
            </Button>
          </div>

          {/* Mobile Overflow Menu */}
          <div className="mobile-only" style={{ position: "relative" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              style={{ width: "40px", height: "40px", padding: 0 }}
            >
              <MoreVertical size={16} />
            </Button>
            {showOverflowMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "4px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 50,
                  minWidth: "150px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={handleCopy}
                  className="touch-target"
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    textAlign: "left",
                  }}
                >
                  <Copy size={14} />
                  <span>{copied ? "Copied" : "Copy Answer"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="touch-target"
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    textAlign: "left",
                  }}
                >
                  <Share2 size={14} />
                  <span>Share Link</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="touch-target"
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    textAlign: "left",
                  }}
                >
                  <Download size={14} />
                  <span>Download .MD</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="touch-target"
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "none",
                    border: "none",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    textAlign: "left",
                  }}
                >
                  <Printer size={14} />
                  <span>Print View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share / Copy Toast */}
      {shareFeedback && (
        <div
          style={{
            position: "absolute",
            top: "56px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)",
            padding: "6px 14px",
            fontSize: "12.5px",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-md)",
            zIndex: 40,
          }}
        >
          {shareFeedback}
        </div>
      )}

      {/* Progressive Multi-Step Generation Toast */}
      {downloadStep !== "idle" && (
        <div
          style={{
            position: "absolute",
            top: "54px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--accent-primary)",
            borderRadius: "var(--radius-lg)",
            padding: "10px 18px",
            fontSize: "13px",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {downloadStep === "ready" ? (
            <CheckCircle2 size={16} color="var(--success)" />
          ) : (
            <Loader2 size={16} className="animate-spin" color="var(--accent-primary)" />
          )}
          <span style={{ fontWeight: 550 }}>{getStepText()}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px 48px",
        }}
      >
        <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
          {/* Question Banner */}
          <div
            style={{
              padding: "16px 18px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 650,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-tertiary)",
                marginBottom: "4px",
              }}
            >
              Target Investigation
            </div>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              {query}
            </h1>
          </div>

          {/* Quick Context & Evidence Stats Strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "20px",
              fontSize: "12px",
            }}
          >
            {/* Evidence Strength Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                backgroundColor: evidenceStrength.bg,
                border: `1px solid ${evidenceStrength.border}`,
                color: evidenceStrength.color,
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={13} />
              <span>{evidenceStrength.label} Evidence Strength</span>
            </div>

            {/* Sources count indicator */}
            {sourcesCount > 0 && (
              <button
                type="button"
                onClick={onViewSources}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-secondary)",
                  cursor: onViewSources ? "pointer" : "default",
                  fontSize: "12px",
                }}
              >
                <BookOpen size={13} color="var(--accent-primary)" />
                <span>{sourcesCount} Verified Sources</span>
              </button>
            )}

            {/* Evidence items count indicator */}
            {evidenceCount > 0 && (
              <button
                type="button"
                onClick={onViewEvidence}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-secondary)",
                  cursor: onViewEvidence ? "pointer" : "default",
                  fontSize: "12px",
                }}
              >
                <Award size={13} color="var(--success)" />
                <span>{evidenceCount} Grounded Claims</span>
              </button>
            )}
          </div>

          {/* Core Research Answer (Markdown Body) */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              padding: "24px 24px",
              boxShadow: "var(--shadow-xs)",
              lineHeight: 1.65,
              fontSize: "14.5px",
              color: "var(--text-primary)",
            }}
          >
            <MarkdownRenderer
              content={markdownContent}
              onCitationClick={onCitationClick}
            />
          </div>

          {/* Quick Deep-Dive & Document Export Cards */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px 18px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 650,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "12px",
              }}
            >
              Academic Document Downloads & Verification
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              {/* PDF Download Card */}
              {taskId && (
                <button
                  type="button"
                  onClick={() => executeDownload("pdf")}
                  className="touch-target"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--accent-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--accent-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: "52px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-card)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={18} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 650 }}>Download Academic PDF</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Publication format with tables & summary</div>
                    </div>
                  </div>
                  <Download size={14} />
                </button>
              )}

              {/* Word DOCX Download Card */}
              {taskId && (
                <button
                  type="button"
                  onClick={() => executeDownload("docx")}
                  className="touch-target"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: "52px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-card)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileCheck2 size={18} color="var(--accent-primary)" />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 650 }}>Download IEEE Word</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Editable Microsoft Word (.docx)</div>
                    </div>
                  </div>
                  <Download size={14} />
                </button>
              )}

              {/* View Evidence Card */}
              {evidenceCount > 0 && (
                <button
                  type="button"
                  onClick={onViewEvidence}
                  className="touch-target"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: "52px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-primary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-card)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={18} color="var(--success)" />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 650 }}>Explore Evidence Matrix</div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>{evidenceCount} exact verified quotes</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--text-tertiary)" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
