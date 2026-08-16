"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "outline" | "ghost" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shortcut?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      shortcut,
      className = "",
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const getVariantStyles = (): React.CSSProperties => {
      switch (variant) {
        case "primary":
          return {
            backgroundColor: "var(--accent-primary)",
            color: "#FFFFFF",
            border: "1px solid transparent",
          };
        case "secondary":
          return {
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-xs)",
          };
        case "subtle":
          return {
            backgroundColor: "var(--bg-subtle)",
            color: "var(--text-primary)",
            border: "1px solid transparent",
          };
        case "outline":
          return {
            backgroundColor: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--border-primary)",
          };
        case "ghost":
          return {
            backgroundColor: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid transparent",
          };
        case "danger":
          return {
            backgroundColor: "var(--danger)",
            color: "#FFFFFF",
            border: "1px solid transparent",
          };
      }
    };

    const getSizeStyles = (): React.CSSProperties => {
      switch (size) {
        case "xs":
          return { padding: "4px 8px", fontSize: "12px", borderRadius: "var(--radius-xs)", gap: "4px" };
        case "sm":
          return { padding: "6px 12px", fontSize: "13px", borderRadius: "var(--radius-sm)", gap: "6px" };
        case "md":
          return { padding: "8px 16px", fontSize: "14px", borderRadius: "var(--radius-md)", gap: "8px" };
        case "lg":
          return { padding: "11px 20px", fontSize: "15px", borderRadius: "var(--radius-lg)", gap: "10px" };
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 500,
          cursor: disabled || isLoading ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.15s ease",
          outline: "none",
          whiteSpace: "nowrap",
          ...getVariantStyles(),
          ...getSizeStyles(),
          ...style,
        }}
        onMouseEnter={(e) => {
          if (disabled || isLoading) return;
          if (variant === "primary") e.currentTarget.style.backgroundColor = "var(--accent-primary-hover)";
          else if (variant === "secondary" || variant === "outline" || variant === "ghost") {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          } else if (variant === "subtle") {
            e.currentTarget.style.backgroundColor = "var(--bg-muted)";
          }
        }}
        onMouseLeave={(e) => {
          if (disabled || isLoading) return;
          Object.assign(e.currentTarget.style, getVariantStyles());
        }}
        className={className}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={size === "xs" ? 12 : size === "sm" ? 14 : 16} className="animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
        {shortcut && (
          <span
            style={{
              marginLeft: "auto",
              padding: "1px 5px",
              borderRadius: "4px",
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-tertiary)",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              border: "1px solid var(--border-primary)",
            }}
          >
            {shortcut}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
