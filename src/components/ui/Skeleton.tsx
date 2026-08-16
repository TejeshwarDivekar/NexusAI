"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "var(--radius-sm)",
  style,
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--border-primary)",
        opacity: 0.6,
        ...style,
      }}
      className={`animate-pulse ${className}`}
      {...props}
    />
  );
}
