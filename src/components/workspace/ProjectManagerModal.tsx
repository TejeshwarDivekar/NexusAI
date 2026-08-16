"use client";

import React, { useState } from "react";
import { FolderKanban, Plus, Trash2, HelpCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const BACKEND_URL = "http://localhost:8000/api/v1";

export interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

export function ProjectManagerModal({
  isOpen,
  onClose,
  onProjectCreated,
}: ProjectManagerModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const handleQuestionChange = (index: number, val: string) => {
    const next = [...questions];
    next[index] = val;
    setQuestions(next);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const validQuestions = questions
        .filter((q) => q.trim().length > 3)
        .map((q) => ({
          question_text: q.trim(),
          objectives: ["Empirical review", "Literature synthesis"],
        }));

      const res = await fetch(`${BACKEND_URL}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          questions: validQuestions.length > 0 ? validQuestions : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create project");
      }

      const created = await res.json();
      onProjectCreated(created);
      onClose();
      setTitle("");
      setDescription("");
      setQuestions([""]);
    } catch (err: any) {
      setError(err.message || "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Research Project"
      description="Organize research questions, documents, evidence, and reports under one unified workspace."
      maxWidth="520px"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Input
          label="Project Title *"
          placeholder="e.g. Scalable Vector Indexing & Memory Optimization"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 550, color: "var(--text-primary)" }}>
            Project Scope & Objective
          </label>
          <textarea
            rows={2}
            placeholder="Brief overview of research goals, hypotheses, and scope..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "13.5px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-primary)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>

        {/* Research Questions Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: "13px", fontWeight: 550, color: "var(--text-primary)" }}>
              Target Research Questions (Optional)
            </label>
            <Button variant="ghost" size="xs" leftIcon={<Plus size={12} />} onClick={handleAddQuestion}>
              Add Question
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {questions.map((q, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="text"
                  placeholder={`Question #${idx + 1} (e.g. What is the throughput trade-off with int4?)`}
                  value={q}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    fontSize: "13px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-primary)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-tertiary)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <span style={{ fontSize: "12px", color: "var(--danger)" }}>{error}</span>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
