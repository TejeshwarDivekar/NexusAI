"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "540px",
  footer,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        className="animate-fade-in"
        style={{
          position: "relative",
          width: "100%",
          maxWidth,
          backgroundColor: "var(--bg-surface-elevated)",
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-popover)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        {/* Header */}
        {(title || description) && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "18px 24px",
              borderBottom: "1px solid var(--border-primary)",
            }}
          >
            <div>
              {title && (
                <h3 style={{ fontSize: "16px", fontWeight: 650, color: "var(--text-primary)" }}>
                  {title}
                </h3>
              )}
              {description && (
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "transparent",
                color: "var(--text-tertiary)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--border-primary)",
              backgroundColor: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
