"use client";

import { MarkdownRenderer } from "./MarkdownRenderer";
import { User, Sparkles, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import type { ChatMessage } from "@/lib/conversations";

interface MessageBubbleProps {
  message: ChatMessage | { role: string; content: string };
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div
      className={isUser ? "animate-slide-right" : "animate-slide-left"}
      style={{
        display: "flex",
        gap: 12,
        padding: "16px 20px",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        maxWidth: "100%",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          minWidth: 36,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isUser
            ? "linear-gradient(135deg, #6366f1, #4f46e5)"
            : "linear-gradient(135deg, #06b6d4, #0891b2)",
          boxShadow: isUser
            ? "0 2px 8px rgba(99, 102, 241, 0.3)"
            : "0 2px 8px rgba(6, 182, 212, 0.3)",
          flexShrink: 0,
        }}
      >
        {isUser ? (
          <User size={18} color="#fff" />
        ) : (
          <Sparkles size={18} color="#fff" />
        )}
      </div>

      {/* Message Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: "85%",
        }}
      >
        {/* Name */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 6,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {isUser ? "You" : "NexusAI"}
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: isUser ? "12px 16px" : "4px 0",
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            background: isUser ? "var(--bg-message-user)" : "transparent",
            color: isUser ? "#fff" : "var(--text-primary)",
            fontSize: 15,
            lineHeight: 1.6,
            wordBreak: "break-word",
            position: "relative",
          }}
        >
          {isUser ? (
            <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
          ) : (
            <>
              {message.content ? (
                <MarkdownRenderer content={message.content} />
              ) : isStreaming ? (
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Actions */}
        {!isUser && message.content && !isStreaming && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 8,
            }}
          >
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-primary)",
                background: "transparent",
                color: copied ? "#10b981" : "var(--text-tertiary)",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.borderColor = "var(--border-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                }
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
