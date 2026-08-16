"use client";

import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        borderRadius: "var(--radius-lg)",
        border: "1px dashed var(--border-secondary)",
        backgroundColor: "var(--bg-subtle)",
        width: "100%",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-secondary)",
          marginBottom: "16px",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {icon}
      </div>
      <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
        {title}
      </h4>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          maxWidth: "380px",
          lineHeight: 1.5,
          marginBottom: actionLabel || secondaryActionLabel ? "20px" : "0",
        }}
      >
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
