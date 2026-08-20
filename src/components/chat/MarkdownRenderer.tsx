"use client";

import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

export interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (citationId: string) => void;
}

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="code-block-wrapper" style={{ margin: "14px 0", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-primary)" }}>
      {language && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 12px",
            background: "var(--bg-subtle)",
            borderBottom: "1px solid var(--border-primary)",
            fontSize: 11,
            color: "var(--text-tertiary)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>{language}</span>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 6px",
              borderRadius: "var(--radius-xs)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-surface)",
              color: copied ? "var(--success)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 11,
              transition: "all 0.2s",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <pre style={{ margin: 0, padding: "12px", backgroundColor: "var(--bg-card)", overflowX: "auto" }}>
        <code className={className} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
          {children}
        </code>
      </pre>
    </div>
  );
}

// Interactive citation badge converter
function renderTextWithCitations(
  text: string,
  onCitationClick?: (citationId: string) => void
): React.ReactNode {
  // Matches [1], [2], [1, 2], [1-3], etc.
  const citationRegex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const citationNumbers = match[1].split(",").map((n) => n.trim());
    
    citationNumbers.forEach((num, numIdx) => {
      parts.push(
        <button
          key={`${match!.index}-${numIdx}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onCitationClick) {
              onCitationClick(num);
            }
          }}
          className="citation-pill"
          title={`View verified evidence citation [${num}]`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1px 6px",
            margin: "0 2px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--accent-subtle)",
            color: "var(--accent-primary)",
            border: "1px solid var(--accent-border)",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.2,
            verticalAlign: "baseline",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent-primary)";
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--accent-subtle)";
            e.currentTarget.style.color = "var(--accent-primary)";
          }}
        >
          [{num}]
        </button>
      );
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function MarkdownRenderer({ content, onCitationClick }: MarkdownRendererProps) {
  return (
    <div className="markdown-body" style={{ color: "var(--text-primary)", lineHeight: 1.65 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className={className}
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.88em",
                    fontFamily: "'JetBrains Mono', monospace",
                    border: "1px solid var(--border-primary)",
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          p({ children }) {
            // Process string children to find citation tokens
            const processedChildren = React.Children.map(children, (child) => {
              if (typeof child === "string") {
                return renderTextWithCitations(child, onCitationClick);
              }
              return child;
            });
            return <p style={{ margin: "0 0 14px 0", fontSize: "15px", lineHeight: 1.68 }}>{processedChildren}</p>;
          },
          li({ children }) {
            const processedChildren = React.Children.map(children, (child) => {
              if (typeof child === "string") {
                return renderTextWithCitations(child, onCitationClick);
              }
              return child;
            });
            return <li style={{ margin: "6px 0", fontSize: "14.5px", lineHeight: 1.6 }}>{processedChildren}</li>;
          },
          h1({ children }) {
            return (
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 750,
                  color: "var(--text-primary)",
                  margin: "20px 0 12px 0",
                  letterSpacing: "-0.01em",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "6px",
                }}
              >
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2
                style={{
                  fontSize: "17.5px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: "18px 0 10px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3
                style={{
                  fontSize: "15.5px",
                  fontWeight: 650,
                  color: "var(--text-primary)",
                  margin: "16px 0 8px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {children}
              </h3>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote
                style={{
                  margin: "14px 0",
                  padding: "10px 16px",
                  borderLeft: "3px solid var(--accent-primary)",
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                }}
              >
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="scroll-container" style={{ margin: "14px 0", overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13.5px",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--bg-subtle)",
                  borderBottom: "1px solid var(--border-primary)",
                  textAlign: "left",
                  fontWeight: 650,
                  color: "var(--text-primary)",
                }}
              >
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-primary)",
                  color: "var(--text-secondary)",
                }}
              >
                {children}
              </td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--accent-primary)",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                {children}
              </a>
            );
          },
        }}
      />
    </div>
  );
}
