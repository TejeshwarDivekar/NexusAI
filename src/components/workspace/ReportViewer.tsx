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
  qualityScore?: number;
  sourceDiversityScore?: number;
  evidenceCoverageScore?: number;
  onCitationClick?: (citationId: string) => void;
  onViewSources?: () => void;
}

export function ReportViewer({
  markdownContent,
  summary,
  query,
  taskId,
  docxDownloadUrl,
  qualityScore = 94.0,
  sourceDiversityScore = 88.0,
  evidenceCoverageScore = 95.0,
  onCitationClick,
  onViewSources,
}: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

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
          title: `Research Report: ${query}`,
          text: summary || `Research report on: ${query}`,
          url: window.location.href,
        });
        return;
      } catch (e) {
        // Fallback to clipboard if user dismissed share sheet
      }
    }
    // Clipboard Fallback
    navigator.clipboard.writeText(window.location.href);
    setShareFeedback("Link copied to clipboard!");
    setTimeout(() => setShareFeedback(null), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Research-Report-${query.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowOverflowMenu(false);
  };

  const handleDownloadDocx = () => {
    if (!taskId) return;
    setIsDownloading(true);
    const downloadUrl = docxDownloadUrl || `/api/v1/research/tasks/${taskId}/document/download`;
    
    // Direct blob download for seamless mobile browser support (Android Chrome & iOS Safari)
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
        // Fallback to direct navigation
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
      {/* Editorial Action Bar */}
      <div
        style={{
          padding: "10px 14px",
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
          <FileText size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
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
            Research Report
          </span>
          <Badge variant="accent" size="sm" icon={<Award size={11} />} className="mobile-hide">
            IEEE Formatted
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
              style={{ minHeight: "44px" }}
            >
              <span className="mobile-hide">Download IEEE Word (.docx)</span>
              <span className="mobile-only">Download Word</span>
            </Button>
          )}

          {/* Desktop Full Actions */}
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

          {/* Mobile Overflow Menu Button */}
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
                  minWidth: "170px",
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
                  <span>{copied ? "Copied Markdown" : "Copy Markdown"}</span>
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
                  <span>Share Report</span>
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
                    <span>View Sources</span>
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

      {/* Share Toast Notification */}
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

      {/* Main Reading Room Canvas */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <article
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            backgroundColor: "var(--bg-surface)",
            padding: "24px 18px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-sm)",
            wordBreak: "break-word",
          }}
        >
          {/* Executive Synthesis Summary Header */}
          {summary && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-primary)",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--accent-primary)",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={13} />
                <span>Executive Synthesis</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                {summary}
              </p>
            </div>
          )}

          {/* Full Markdown Render */}
          <div className="editorial-report">
            <MarkdownRenderer content={markdownContent} />
          </div>
        </article>
      </div>
    </div>
  );
}
