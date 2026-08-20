"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pills" | "segmented";
  fullWidth?: boolean;
}

export function Tabs({ tabs, activeTab, onChange, variant = "underline", fullWidth = false }: TabsProps) {
  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        style={{
          display: "flex",
          width: fullWidth ? "100%" : "auto",
          padding: "4px",
          backgroundColor: "var(--bg-subtle)",
          borderRadius: "var(--radius-md)",
          gap: "4px",
          border: "1px solid var(--border-primary)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className="touch-target"
              style={{
                flex: fullWidth ? 1 : "initial",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 14px",
                minHeight: "44px",
                fontSize: "13.5px",
                fontWeight: isActive ? 650 : 500,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--bg-surface)" : "transparent",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                boxShadow: isActive ? "var(--shadow-xs)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    padding: "2px 7px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "var(--radius-full)",
                    backgroundColor: isActive ? "var(--accent-subtle)" : "var(--bg-muted)",
                    color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "pills") {
    return (
      <div
        role="tablist"
        style={{
          display: "inline-flex",
          padding: "3px",
          backgroundColor: "var(--bg-subtle)",
          borderRadius: "var(--radius-md)",
          gap: "2px",
          border: "1px solid var(--border-primary)",
          width: fullWidth ? "100%" : "auto",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className="touch-target"
              style={{
                flex: fullWidth ? 1 : "initial",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 12px",
                minHeight: "40px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--bg-surface)" : "transparent",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                boxShadow: isActive ? "var(--shadow-xs)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    padding: "1px 6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "var(--radius-full)",
                    backgroundColor: isActive ? "var(--accent-subtle)" : "var(--bg-muted)",
                    color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        borderBottom: "1px solid var(--border-primary)",
        gap: "24px",
        width: "100%",
        overflowX: "auto",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className="touch-target"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "12px 0",
              minHeight: "44px",
              fontSize: "13.5px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--accent-primary)" : "transparent"}`,
              marginBottom: "-1px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isActive ? "var(--accent-subtle)" : "var(--bg-subtle)",
                  color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
