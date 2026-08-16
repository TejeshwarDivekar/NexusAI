"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Paperclip, X, FileText, Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onFileUpload?: (file: File) => void;
  uploadedFile?: { name: string; charCount: number } | null;
  onRemoveFile?: () => void;
  isUploading?: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onFileUpload,
  uploadedFile,
  onRemoveFile,
  isUploading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, [input]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div
      style={{
        padding: "16px 20px 24px",
        borderTop: "1px solid var(--border-primary)",
        background: "var(--bg-primary)",
      }}
    >
      {/* Uploaded File Badge */}
      {uploadedFile && (
        <div
          className="animate-fade-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            marginBottom: 10,
            borderRadius: 10,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-primary)",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <FileText size={14} color="var(--color-primary)" />
          <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {uploadedFile.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            ({(uploadedFile.charCount / 1000).toFixed(1)}k chars)
          </span>
          <button
            onClick={onRemoveFile}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              borderRadius: 4,
              border: "none",
              background: "var(--bg-hover)",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 16,
          border: `1.5px solid ${isFocused ? "var(--border-focus)" : "var(--border-primary)"}`,
          background: "var(--bg-input)",
          transition: "all 0.3s ease",
          boxShadow: isFocused ? "var(--shadow-glow)" : "var(--shadow-sm)",
        }}
      >
        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: "var(--text-tertiary)",
            cursor: isUploading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          title="Upload a file"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "var(--bg-tertiary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept=".txt,.md,.csv,.json,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.rs,.go,.rb,.php,.sql,.xml,.yaml,.yml,.toml,.sh,.pdf"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask NexusAI anything..."
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 15,
            lineHeight: 1.5,
            color: "var(--text-primary)",
            fontFamily: "inherit",
            maxHeight: 200,
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 12,
            border: "none",
            background:
              input.trim() && !isLoading
                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                : "var(--bg-tertiary)",
            color: input.trim() && !isLoading ? "#fff" : "var(--text-tertiary)",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            transition: "all 0.3s ease",
            flexShrink: 0,
            boxShadow:
              input.trim() && !isLoading
                ? "0 2px 8px rgba(99, 102, 241, 0.4)"
                : "none",
          }}
        >
          {isLoading ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>

      {/* Hint */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 8,
          fontSize: 11,
          color: "var(--text-tertiary)",
        }}
      >
        <span>
          <kbd style={{ padding: "1px 5px", borderRadius: 4, background: "var(--bg-tertiary)", fontSize: 10 }}>
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd style={{ padding: "1px 5px", borderRadius: 4, background: "var(--bg-tertiary)", fontSize: 10 }}>
            Shift+Enter
          </kbd>{" "}
          for new line
        </span>
      </div>
    </div>
  );
}
