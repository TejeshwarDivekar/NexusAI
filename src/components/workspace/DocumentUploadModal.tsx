"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const BACKEND_URL = "http://localhost:8000/api/v1";

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (doc: { id: number; filename: string; charCount: number; chunksCount: number }) => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "parsing" | "chunking" | "indexing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setUploadStatus("idle");
    setErrorMessage("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds 25MB limit.");
      return;
    }
    setFile(selectedFile);
    setErrorMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadStatus("parsing");
      const res = await fetch(`${BACKEND_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed on server.");
      }

      setUploadStatus("indexing");
      const data = await res.json();

      setUploadStatus("success");
      onUploadSuccess({
        id: data.id,
        filename: data.filename,
        charCount: data.char_count,
        chunksCount: data.chunks_created,
      });

      setTimeout(() => {
        onClose();
        resetState();
      }, 1200);
    } catch (err: any) {
      setUploadStatus("error");
      setErrorMessage(err.message || "Failed to process document.");
    }
  };

  const progressSteps = [
    { key: "uploading", label: "1. Uploading Document" },
    { key: "parsing", label: "2. Extracting PDF / Text Content" },
    { key: "indexing", label: "3. Generating Semantic Chunks & Embeddings" },
    { key: "success", label: "4. Indexing Complete & Ready" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetState();
      }}
      title="Upload Research Papers & Documents"
      description="Ingest PDF or text files into the project vector index for grounded retrieval."
      maxWidth="500px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "36px 24px",
            border: `2px dashed ${isDragging ? "var(--accent-primary)" : "var(--border-secondary)"}`,
            borderRadius: "var(--radius-lg)",
            backgroundColor: isDragging ? "var(--accent-subtle)" : "var(--bg-subtle)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.json,.csv"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
              marginBottom: "12px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <UploadCloud size={24} />
          </div>

          <h5 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
            {file ? file.name : "Drop research paper here or click to browse"}
          </h5>

          <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            Supports PDF, TXT, Markdown, CSV up to 25MB
          </p>
        </div>

        {/* Selected File Details & Processing Steps */}
        {file && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-primary)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {file.name}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>

            {uploadStatus !== "idle" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                {progressSteps.map((step) => {
                  const isCurrent = uploadStatus === step.key;
                  const isDone =
                    uploadStatus === "success" ||
                    (uploadStatus === "indexing" && step.key !== "indexing") ||
                    (uploadStatus === "parsing" && step.key === "uploading");

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: isDone ? "var(--success-text)" : isCurrent ? "var(--accent-primary)" : "var(--text-tertiary)",
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={13} color="var(--success)" />
                      ) : isCurrent ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <span style={{ width: "13px", height: "13px", display: "inline-block" }} />
                      )}
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={uploadStatus === "uploading" || uploadStatus === "indexing"}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={!file || uploadStatus === "success" || uploadStatus === "indexing"}
            isLoading={uploadStatus === "uploading" || uploadStatus === "parsing" || uploadStatus === "indexing"}
          >
            Start Ingestion
          </Button>
        </div>
      </div>
    </Modal>
  );
}
