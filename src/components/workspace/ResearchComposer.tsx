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
  Calendar,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit(e as any);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "16px 14px",
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
              width: "26px",
              height: "26px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--accent-subtle)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={15} />
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
          placeholder="What research inquiry or scientific hypothesis would you like to investigate? (e.g. Compare memory efficiency in KV-cache quantization for LLMs)"
          style={{
            width: "100%",
            fontSize: "15px",
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
          <span style={{ fontSize: "12px", fontWeight: 650, color: "var(--text-tertiary)" }}>
            Scope:
          </span>

          <button
            type="button"
            onClick={() => onScopeChange({ ...scope, includeAcademic: !scope.includeAcademic })}
            className="touch-target"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12.5px",
              fontWeight: scope.includeAcademic ? 650 : 500,
              border: `1px solid ${scope.includeAcademic ? "var(--accent-primary)" : "var(--border-primary)"}`,
              backgroundColor: scope.includeAcademic ? "var(--accent-subtle)" : "var(--bg-subtle)",
              color: scope.includeAcademic ? "var(--accent-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              minHeight: "44px",
            }}
          >
            <BookOpen size={14} />
            <span>Academic</span>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange({ ...scope, includeWeb: !scope.includeWeb })}
            className="touch-target"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12.5px",
              fontWeight: scope.includeWeb ? 650 : 500,
              border: `1px solid ${scope.includeWeb ? "var(--accent-primary)" : "var(--border-primary)"}`,
              backgroundColor: scope.includeWeb ? "var(--accent-subtle)" : "var(--bg-subtle)",
              color: scope.includeWeb ? "var(--accent-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              minHeight: "44px",
            }}
          >
            <Globe size={14} />
            <span>Web</span>
          </button>

          {onOpenUpload && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="touch-target"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12.5px",
                fontWeight: 500,
                border: "1px solid var(--border-primary)",
                backgroundColor: "var(--bg-subtle)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              <FileText size={14} />
              <span>Docs ({uploadedDocCount})</span>
            </button>
          )}
        </div>

        {/* Depth & Start Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", width: "100%", justifyContent: "space-between" }}>
          {/* Depth Segment */}
          <div
            style={{
              display: "inline-flex",
              padding: "3px",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "var(--radius-md)",
              gap: "2px",
              border: "1px solid var(--border-primary)",
            }}
          >
            {(["fast", "standard", "deep"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDepthChange(d)}
                style={{
                  padding: "6px 10px",
                  fontSize: "12px",
                  fontWeight: depth === d ? 650 : 500,
                  textTransform: "capitalize",
                  color: depth === d ? "var(--text-primary)" : "var(--text-secondary)",
                  backgroundColor: depth === d ? "var(--bg-surface)" : "transparent",
                  borderRadius: "var(--radius-xs)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: depth === d ? "var(--shadow-xs)" : "none",
                  transition: "all 0.15s ease",
                  minHeight: "36px",
                }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={15} />}
            isLoading={isLoading}
            disabled={!query.trim() || isLoading}
            style={{
              minHeight: "48px",
              padding: "0 22px",
              fontSize: "14px",
              fontWeight: 650,
            }}
          >
            Start Research
          </Button>
        </div>
      </div>
    </form>
  );
}
