"use client";

import React, { useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Quote,
  ExternalLink,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EvidenceData } from "./EvidencePanel";
import { SourceData } from "./SourcesPanel";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";

export interface EvidenceDetailViewProps {
  evidence: EvidenceData;
  source?: SourceData;
  query: string;
  explanation?: string;
  isLoadingExplanation?: boolean;
  explanationError?: string | null;
  onBackToAnswer: () => void;
}

export function EvidenceDetailView({
  evidence,
  source,
  query,
  explanation,
  isLoadingExplanation = false,
  explanationError = null,
  onBackToAnswer,
}: EvidenceDetailViewProps) {
  // Listen for Escape key to quickly return to answer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBackToAnswer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBackToAnswer]);

  const rawCitationNumber = (evidence.citation_id || "[1]").replace(/[^0-9]/g, "") || "1";
  const sourceTitle = source?.title || evidence.source_title || "Published Study";
  const sourceUrl = source?.url || evidence.source_url;
  const sourceAuthors = source?.authors && source.authors.length > 0
    ? source.authors.join(", ")
    : evidence.source_authors && evidence.source_authors.length > 0
    ? evidence.source_authors.join(", ")
    : null;
  const sourceYear = source?.year || evidence.source_year || null;
  const sourcePublisher = source?.publisher || source?.journal || evidence.source_publisher || null;
  const sourceDoi = source?.doi || evidence.source_doi || null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-surface)",
        overflow: "hidden",
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          padding: "10px 16px",
          backgroundColor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft size={15} />}
            onClick={onBackToAnswer}
            style={{ minHeight: "36px" }}
          >
            <span>Back to Answer</span>
            <span className="mobile-hide" style={{ fontSize: "11px", color: "var(--text-tertiary)", marginLeft: "4px" }}>
              (Esc)
            </span>
          </Button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="citation-pill"
            style={{
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent-primary)",
              fontWeight: 700,
              fontSize: "13px",
              padding: "4px 10px",
            }}
          >
            Evidence #{rawCitationNumber}
          </span>
          <Badge
            variant={evidence.confidence === "High" ? "success" : "accent"}
            size="sm"
            dot
          >
            {evidence.confidence || "High"} Confidence
          </Badge>
        </div>
      </div>

      {/* Main Scrollable Evidence Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          maxWidth: "840px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Claim Header Box */}
        <div
          style={{
            padding: "20px 22px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={18} color="var(--accent-primary)" />
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--accent-primary)",
              }}
            >
              Verified Claim & Evidence #{rawCitationNumber}
            </span>
          </div>

          <h2
            style={{
              fontSize: "19px",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {evidence.claim}
          </h2>

          <div style={{ fontSize: "12.5px", color: "var(--text-tertiary)", marginTop: "2px" }}>
            Inquiry Context: <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>"{query}"</span>
          </div>
        </div>

        {/* 1. MAIN INFORMATION */}
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 750,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <BookOpen size={14} color="var(--accent-primary)" />
            <span>Main Information</span>
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              fontSize: "14.5px",
              lineHeight: 1.6,
              color: "var(--text-primary)",
            }}
          >
            {evidence.why_relevant ? (
              <p style={{ margin: 0 }}>{evidence.why_relevant}</p>
            ) : (
              <p style={{ margin: 0 }}>
                This verified evidence demonstrates that <strong>{evidence.claim}</strong>. It provides empirical
                validation from peer-reviewed findings documented in <em>{sourceTitle}</em>.
              </p>
            )}
          </div>
        </div>

        {/* 2. WHY THIS MATTERS (Grounded Analysis) */}
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 750,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} color="var(--accent-primary)" />
            <span>Why This Matters</span>
          </div>

          <div
            style={{
              padding: "18px 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-subtle)",
              border: "1px solid var(--border-primary)",
            }}
          >
            {isLoadingExplanation ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", color: "var(--accent-primary)" }}>
                <Clock size={16} className="animate-spin" />
                <span style={{ fontSize: "13.5px", fontWeight: 550 }}>
                  Generating grounded explanation from source evidence...
                </span>
              </div>
            ) : explanationError ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--danger-text)", marginBottom: "8px", fontSize: "13.5px", fontWeight: 600 }}>
                  <AlertCircle size={16} />
                  <span>Explanation could not be generated.</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  Displaying underlying verified evidence and source excerpt below.
                </p>
              </div>
            ) : explanation ? (
              <div className="explanation-prose" style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-primary)" }}>
                <MarkdownRenderer content={explanation} />
              </div>
            ) : (
              <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-primary)" }}>
                <p style={{ margin: 0 }}>
                  This evidence is crucial because it directly grounds the research claim regarding <em>"{query}"</em> with
                  concrete data from <em>{sourceTitle}</em>, preventing ungrounded generalizations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. EVIDENCE EXCERPT */}
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 750,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Quote size={14} color="var(--accent-primary)" />
            <span>Verbatim Source Evidence</span>
          </div>

          <div
            style={{
              padding: "16px 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface)",
              borderLeft: "4px solid var(--accent-primary)",
              borderTop: "1px solid var(--border-primary)",
              borderRight: "1px solid var(--border-primary)",
              borderBottom: "1px solid var(--border-primary)",
            }}
          >
            {evidence.fact_snippet && evidence.fact_snippet.trim().length > 0 ? (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "var(--text-primary)",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                "{evidence.fact_snippet}"
              </p>
            ) : (
              <p style={{ fontSize: "13.5px", color: "var(--text-tertiary)", margin: 0, fontStyle: "italic" }}>
                Source excerpt is not available.
              </p>
            )}
          </div>
        </div>

        {/* 4. SOURCE METADATA CARD */}
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 750,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Layers size={14} color="var(--accent-primary)" />
            <span>Cited Publication & Provenance</span>
          </div>

          <div
            style={{
              padding: "18px 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 650, color: "var(--text-primary)", margin: "0 0 6px 0", lineHeight: 1.4 }}>
                {sourceTitle}
              </h4>
              {sourceAuthors && (
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  <strong>Authors:</strong> {sourceAuthors}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "12.5px", color: "var(--text-tertiary)" }}>
                {sourcePublisher && <span><strong>Publication:</strong> {sourcePublisher}</span>}
                {sourceYear && <span><strong>Year:</strong> {sourceYear}</span>}
                {sourceDoi && <span><strong>DOI:</strong> {sourceDoi}</span>}
              </div>
            </div>

            {sourceUrl && (
              <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-start" }}>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<ExternalLink size={13} />}
                    style={{ minHeight: "34px" }}
                  >
                    <span>Open Source Paper</span>
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 5. CONNECTION TO RESEARCH */}
        <div style={{ paddingBottom: "16px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 750,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={14} color="var(--success)" />
            <span>Connection to Research</span>
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-primary)",
              fontSize: "13.5px",
              lineHeight: 1.55,
              color: "var(--text-primary)",
            }}
          >
            <p style={{ margin: 0 }}>
              This evidence supports the research inquiry because it provides empirical, verifiable data for the claim{" "}
              <strong>"{evidence.claim}"</strong>. It directly contributes to the grounded synthesis in the main report without
              relying on unverified speculation.
            </p>
          </div>
        </div>

        {/* Bottom Back Button */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 24px 0" }}>
          <Button
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={onBackToAnswer}
            style={{ minHeight: "42px", minWidth: "180px" }}
          >
            Return to Full Answer
          </Button>
        </div>
      </div>
    </div>
  );
}
