"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Globe,
  BookOpen,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ResearchScope {
  includeWeb: boolean;
  includeAcademic: boolean;
  includeDocuments: boolean;
}

export interface ResearchComposerProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  scope: ResearchScope;
  onScopeChange: (scope: ResearchScope) => void;
  depth: "fast" | "standard" | "deep";
  onDepthChange: (depth: "fast" | "standard" | "deep") => void;
  uploadedDocCount?: number;
  onOpenUpload?: () => void;
}

export function ResearchComposer({
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  scope,
  onScopeChange,
  depth,
  onDepthChange,
  uploadedDocCount = 0,
  onOpenUpload,
}: ResearchComposerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [focusArea, setFocusArea] = useState("all");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "16px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Header & Prompt Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            }}
          >
            <Sparkles size={14} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 650, color: "var(--text-primary)" }}>
            Deep Research Investigation
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={14} color="var(--success)" />
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
            Deterministic Evidence Grounding
          </span>
        </div>
      </div>

      {/* Main Textarea */}
      <div style={{ position: "relative", width: "100%" }}>
        <textarea
          rows={3}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What research inquiry or scientific hypothesis would you like to investigate? (e.g. Compare memory efficiency in KV-cache quantization for long-context LLMs)"
          style={{
            width: "100%",
            fontSize: "14.5px",
            lineHeight: 1.6,
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            outline: "none",
            resize: "vertical",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            fontFamily: "inherit",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--border-focus)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-subtle)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-primary)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Scope Chips & Depth Selectors */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {/* Scope Selectors */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)" }}>
            Scope:
          </span>

          <button
            type="button"
            onClick={() => onScopeChange({ ...scope, includeAcademic: !scope.includeAcademic })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 10px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: `1px solid ${scope.includeAcademic ? "var(--accent-primary)" : "var(--border-primary)"}`,
              backgroundColor: scope.includeAcademic ? "var(--accent-subtle)" : "transparent",
              color: scope.includeAcademic ? "var(--accent-primary)" : "var(--text-secondary)",
              minHeight: "36px",
            }}
          >
            <BookOpen size={13} />
            <span>Academic</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange({ ...scope, includeWeb: !scope.includeWeb })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 10px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: `1px solid ${scope.includeWeb ? "var(--accent-primary)" : "var(--border-primary)"}`,
              backgroundColor: scope.includeWeb ? "var(--accent-subtle)" : "transparent",
              color: scope.includeWeb ? "var(--accent-primary)" : "var(--text-secondary)",
              minHeight: "36px",
            }}
          >
            <Globe size={13} />
            <span>Web</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (uploadedDocCount === 0 && onOpenUpload) {
                onOpenUpload();
              } else {
                onScopeChange({ ...scope, includeDocuments: !scope.includeDocuments });
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 10px",
              borderRadius: "var(--radius-full)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: `1px solid ${scope.includeDocuments ? "var(--accent-primary)" : "var(--border-primary)"}`,
              backgroundColor: scope.includeDocuments ? "var(--accent-subtle)" : "transparent",
              color: scope.includeDocuments ? "var(--accent-primary)" : "var(--text-secondary)",
              minHeight: "36px",
            }}
          >
            <FileText size={13} />
            <span>Docs ({uploadedDocCount})</span>
          </button>
        </div>

        {/* Depth Selector & Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "2px",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-primary)",
              gap: "2px",
            }}
          >
            {(["fast", "standard", "deep"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDepthChange(d)}
                style={{
                  padding: "5px 9px",
                  fontSize: "12px",
                  fontWeight: depth === d ? 600 : 500,
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  backgroundColor: depth === d ? "var(--bg-surface)" : "transparent",
                  color: depth === d ? "var(--text-primary)" : "var(--text-tertiary)",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  boxShadow: depth === d ? "var(--shadow-xs)" : "none",
                  minHeight: "32px",
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              cursor: "pointer",
              minHeight: "36px",
            }}
          >
            <SlidersHorizontal size={13} />
            <span className="mobile-hide">Options</span>
            {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Advanced Drawer */}
      {showAdvanced && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-primary)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Synthesis Focus Area:
            </label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-primary)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-primary)",
                outline: "none",
                minHeight: "36px",
              }}
            >
              <option value="all">Comprehensive Analysis</option>
              <option value="architecture">Architecture & Methods</option>
              <option value="benchmarks">Benchmarks & Empirical Metrics</option>
              <option value="limitations">Limitations & Open Problems</option>
            </select>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          borderTop: "1px solid var(--border-primary)",
          paddingTop: "12px",
        }}
      >
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={!query.trim() || isLoading}
          rightIcon={<ArrowRight size={15} />}
          onClick={onSubmit}
          style={{
            width: "100%",
            maxWidth: "240px",
            minHeight: "44px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Start Research
        </Button>
      </div>
    </div>
  );
}
