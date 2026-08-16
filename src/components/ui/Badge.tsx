"use client";

import React from "react";

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  icon,
  className = "",
  style,
  ...props
}: BadgeProps) {
  const getVariantStyles = (): { bg: string; text: string; border: string; dotBg: string } => {
    switch (variant) {
      case "accent":
        return {
          bg: "var(--accent-subtle)",
          text: "var(--accent-primary)",
          border: "var(--accent-border)",
          dotBg: "var(--accent-primary)",
        };
      case "success":
        return {
          bg: "var(--success-bg)",
          text: "var(--success-text)",
          border: "var(--success-border)",
          dotBg: "var(--success)",
        };
      case "warning":
        return {
          bg: "var(--warning-bg)",
          text: "var(--warning-text)",
          border: "var(--warning-border)",
          dotBg: "var(--warning)",
        };
      case "danger":
        return {
          bg: "var(--danger-bg)",
          text: "var(--danger-text)",
          border: "var(--danger-border)",
          dotBg: "var(--danger)",
        };
      case "info":
        return {
          bg: "var(--info-bg)",
          text: "var(--info-text)",
          border: "var(--info-border)",
          dotBg: "var(--info)",
        };
      case "neutral":
      default:
        return {
          bg: "var(--bg-subtle)",
          text: "var(--text-secondary)",
          border: "var(--border-primary)",
          dotBg: "var(--text-tertiary)",
        };
    }
  };

  const v = getVariantStyles();
  const isSm = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSm ? "4px" : "6px",
        padding: isSm ? "2px 6px" : "3px 8px",
        fontSize: isSm ? "11px" : "12px",
        fontWeight: 550,
        borderRadius: "var(--radius-full)",
        backgroundColor: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        userSelect: "none",
        ...style,
      }}
      className={className}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: v.dotBg,
          }}
        />
      )}
      {icon}
      {children}
    </span>
  );
}
