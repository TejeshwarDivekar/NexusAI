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
  sourcesCount?: number;
  evidenceCount?: number;
  qualityScore?: number;
  sourceDiversityScore?: number;
  evidenceCoverageScore?: number;
  onCitationClick?: (citationId: string) => void;
  onViewSources?: () => void;
  onViewEvidence?: () => void;
}

export function ReportViewer({
  markdownContent,
  summary,
  query,
  taskId,
  docxDownloadUrl,
  sourcesCount = 0,
  evidenceCount = 0,
  onCitationClick,
  onViewSources,
  onViewEvidence,
}: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownloadDocx = () => {
    if (!taskId) return;
    setIsDownloading(true);
    const downloadUrl = docxDownloadUrl || `/api/v1/research/tasks/${taskId}/document/download`;
    
    fetch(downloadUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Download failed");
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `IEEE_Research_Paper_${query.slice(0, 25).replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setIsDownloading(false);
      })
      .catch(() => {
        window.open(downloadUrl, "_blank");
        setTimeout(() => setIsDownloading(false), 1500);
      });
  };

  const handlePrint = () => {
    setShowOverflowMenu(false);
    window.print();
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
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileCheck2 size={14} />}
              onClick={handleDownloadDocx}
              isLoading={isDownloading}
              style={{ minHeight: "40px" }}
            >
              <span className="mobile-hide">Download IEEE Word (.docx)</span>
              <span className="mobile-only">Download Word</span>
            </Button>
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
              variant="outline"
              size="sm"
              leftIcon={<Printer size={13} />}
              onClick={handlePrint}
              style={{ minHeight: "36px" }}
            >
              Print
            </Button>
          </div>

          {/* Mobile Overflow Menu */}
          <div className="md-hide" style={{ position: "relative" }}>
            <button
              onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              aria-label="More actions"
              className="touch-target"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-primary)",
                backgroundColor: "var(--bg-subtle)",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <MoreVertical size={18} />
            </button>

            {showOverflowMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "48px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "6px",
                  zIndex: 60,
                  minWidth: "175px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <button
                  onClick={handleCopy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "left",
                    minHeight: "44px",
                  }}
                >
                  {copied ? <Check size={15} color="var(--success)" /> : <Copy size={15} />}
                  <span>{copied ? "Copied" : "Copy Answer"}</span>
                </button>

                <button
                  onClick={handleShare}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "left",
                    minHeight: "44px",
                  }}
                >
                  <Share2 size={15} />
                  <span>Share</span>
                </button>

                {onViewSources && (
                  <button
                    onClick={() => {
                      setShowOverflowMenu(false);
                      onViewSources();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "left",
                      minHeight: "44px",
                    }}
                  >
                    <Layers size={15} />
                    <span>View Sources ({sourcesCount})</span>
                  </button>
                )}

                {onViewEvidence && (
                  <button
                    onClick={() => {
                      setShowOverflowMenu(false);
                      onViewEvidence();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      borderRadius: "var(--radius-sm)",
                      textAlign: "left",
                      minHeight: "44px",
                    }}
                  >
                    <ShieldCheck size={15} />
                    <span>View Evidence ({evidenceCount})</span>
                  </button>
                )}

                <button
                  onClick={handleDownloadMarkdown}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "left",
                    minHeight: "44px",
                  }}
                >
                  <Download size={15} />
                  <span>Export Markdown</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {shareFeedback && (
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "var(--accent-subtle)",
            color: "var(--accent-primary)",
            fontSize: "12.5px",
            fontWeight: 600,
            textAlign: "center",
            borderBottom: "1px solid var(--accent-border)",
          }}
        >
          {shareFeedback}
        </div>
      )}

      {/* Center Answer-First Content Canvas */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px 14px 40px 14px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            backgroundColor: "var(--bg-surface)",
            padding: "24px 22px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-sm)",
            wordBreak: "break-word",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Research Title / Question */}
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 750,
                color: "var(--text-primary)",
                lineHeight: 1.35,
                margin: "0 0 10px 0",
                letterSpacing: "-0.015em",
              }}
            >
              {query}
            </h1>

            {/* Subtle Real Research Metadata Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                fontSize: "12.5px",
                color: "var(--text-secondary)",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: evidenceStrength.bg,
                  color: evidenceStrength.color,
                  border: `1px solid ${evidenceStrength.border}`,
                  fontSize: "11.5px",
                  fontWeight: 650,
                }}
              >
                <ShieldCheck size={12} />
                <span>Evidence strength: {evidenceStrength.label}</span>
              </div>

              <span>•</span>

              <span style={{ color: "var(--text-secondary)" }}>
                Based on <strong style={{ color: "var(--text-primary)" }}>{sourcesCount}</strong> verified sources
              </span>

              {evidenceCount > 0 && (
                <>
                  <span>•</span>
                  <span><strong style={{ color: "var(--text-primary)" }}>{evidenceCount}</strong> grounded claims</span>
                </>
              )}
            </div>
          </div>

          {/* Main Answer Stream (Answer-First) */}
          <div className="editorial-report" style={{ fontSize: "15px" }}>
            <MarkdownRenderer
              content={markdownContent}
              onCitationClick={onCitationClick}
            />
          </div>

          {/* Verification & Exploration Layer Footer */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border-primary)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 650, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Verification & Detailed Documents
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              {onViewSources && (
                <button
                  type="button"
                  onClick={onViewSources}
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
                    minHeight: "48px",
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
                    <Layers size={16} color="var(--accent-primary)" />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 650 }}>View Sources</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-tertiary)" }}>{sourcesCount} indexed papers & registries</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--text-tertiary)" />
                </button>
              )}

              {onViewEvidence && (
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
                    minHeight: "48px",
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
                    <ShieldCheck size={16} color="var(--success)" />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 650 }}>Explore Evidence Matrix</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-tertiary)" }}>{evidenceCount} exact verified quotes</div>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--text-tertiary)" />
                </button>
              )}

              {taskId && (
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="touch-target"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--accent-subtle)",
                    border: "1px solid var(--accent-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--accent-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: "48px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-card)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-subtle)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileCheck2 size={16} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 650 }}>Download IEEE Word</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>Complete formal academic paper (.docx)</div>
                    </div>
                  </div>
                  <Download size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
