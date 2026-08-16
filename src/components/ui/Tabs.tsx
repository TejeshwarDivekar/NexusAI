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
  variant?: "underline" | "pills";
}

export function Tabs({ tabs, activeTab, onChange, variant = "underline" }: TabsProps) {
  if (variant === "pills") {
    return (
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
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
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
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    padding: "1px 5px",
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
      style={{
        display: "flex",
        borderBottom: "1px solid var(--border-primary)",
        gap: "24px",
        width: "100%",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 0",
              fontSize: "13.5px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--accent-primary)" : "transparent"}`,
              marginBottom: "-1px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab.icon}
            {tab.label}
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
