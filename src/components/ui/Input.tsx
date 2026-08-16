"use client";

import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", style, ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        {label && (
          <label style={{ fontSize: "13px", fontWeight: 550, color: "var(--text-primary)" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
          {leftIcon && (
            <div
              style={{
                position: "absolute",
                left: "12px",
                display: "flex",
                alignItems: "center",
                color: "var(--text-tertiary)",
                pointerEvents: "none",
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: "100%",
              padding: leftIcon && rightIcon ? "8px 36px" : leftIcon ? "8px 12px 8px 36px" : rightIcon ? "8px 36px 8px 12px" : "8px 12px",
              fontSize: "14px",
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-surface)",
              border: `1px solid ${error ? "var(--danger)" : "var(--border-primary)"}`,
              borderRadius: "var(--radius-md)",
              outline: "none",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              boxShadow: "var(--shadow-xs)",
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border-focus)";
              e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "rgba(239, 68, 68, 0.15)" : "var(--accent-subtle)"}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border-primary)";
              e.currentTarget.style.boxShadow = "var(--shadow-xs)";
            }}
            className={className}
            {...props}
          />
          {rightIcon && (
            <div
              style={{
                position: "absolute",
                right: "12px",
                display: "flex",
                alignItems: "center",
                color: "var(--text-tertiary)",
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span style={{ fontSize: "12px", color: "var(--danger)" }}>{error}</span>}
        {helperText && !error && <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
