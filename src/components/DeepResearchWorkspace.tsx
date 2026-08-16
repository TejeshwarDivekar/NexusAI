"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  FolderPlus,
  ArrowRight,
  ShieldCheck,
  Layers,
  Database,
  Globe,
  BookOpen,
  Cpu,
  RefreshCw,
  UploadCloud,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react";
import { MarkdownRenderer } from "./chat/MarkdownRenderer";
import { ClaudeArtifactCanvas } from "./ClaudeArtifactCanvas";

const BACKEND_URL = "http://localhost:8000/api/v1";

interface SourceItem {
  title: string;
  url: string;
  snippet: string;
  source_type: string;
  reliability: number;
}

interface EvidenceItem {
  citation_id: string;
  source_title: string;
  source_url: string;
  claim: string;
  fact_snippet: string;
  confidence: string;
}

interface ProjectItem {
  id: number;
  title: string;
  description: string;
}

export default function DeepResearchWorkspace() {
  // Form & Query State
  const [query, setQuery] = useState("");
  const [includeAcademic, setIncludeAcademic] = useState(true);

  // Execution State
  const [isResearching, setIsResearching] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [subQueries, setSubQueries] = useState<string[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [evidenceMatrix, setEvidenceMatrix] = useState<EvidenceItem[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState<string>("");
  const [reportSummary, setReportSummary] = useState<string>("");

  // Claude UI State
  const [showThoughtProcess, setShowThoughtProcess] = useState(true);
  const [showArtifactCanvas, setShowArtifactCanvas] = useState(false);

  // Projects & History
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");

  // Document Upload
  const [uploadedDocId, setUploadedDocId] = useState<number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Auth State (Google OAuth + Native JWT)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; username: string; email: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authError, setAuthError] = useState("");

  // Load stored auth & projects on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("nexus_jwt_token");
    const savedUser = localStorage.getItem("nexus_user_info");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Failed to fetch projects:", e);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newProjectTitle }),
      });
      if (res.ok) {
        const project = await res.json();
        setProjects([project, ...projects]);
        setSelectedProjectId(project.id);
        setNewProjectTitle("");
      }
    } catch (e) {
      console.error("Project creation error:", e);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedDocId(data.id);
        setUploadedFileName(data.filename);
      }
    } catch (e) {
      console.error("Document upload failed:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunDeepResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isResearching) return;

    setIsResearching(true);
    setShowArtifactCanvas(false);
    setProgress(5);
    setCurrentStep("1. Initializing Claude Reasoning & Query Planning");
    setSubQueries([]);
    setSources([]);
    setEvidenceMatrix([]);
    setReportMarkdown("");

    // SSE Streaming Endpoint for Real-time progress updates
    const streamUrl = `${BACKEND_URL}/research/stream?query=${encodeURIComponent(query)}&include_academic=${includeAcademic}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.progress) setProgress(data.progress);
        if (data.step) setCurrentStep(data.step);
        if (data.sub_queries) setSubQueries(data.sub_queries);
        if (data.sources) setSources(data.sources);
        if (data.evidence_matrix) setEvidenceMatrix(data.evidence_matrix);
        if (data.report_markdown) {
          setReportMarkdown(data.report_markdown);
          setShowArtifactCanvas(true); // Open Claude Artifact Canvas!
        }
        if (data.report_summary) setReportSummary(data.report_summary);

        if (data.status === "completed") {
          setIsResearching(false);
          setShowArtifactCanvas(true);
          eventSource.close();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE stream error:", err);
      eventSource.close();
      fallbackSyncResearch();
    };
  };

  const fallbackSyncResearch = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/research/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          include_academic: includeAcademic,
          document_ids: uploadedDocId ? [uploadedDocId] : [],
          project_id: selectedProjectId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportMarkdown(data.report_markdown);
        setReportSummary(data.report_summary);
        setSources(data.sources);
        setEvidenceMatrix(data.evidence_matrix);
        setSubQueries(data.sub_queries);
        setProgress(100);
        setCurrentStep("Research Complete");
        setShowArtifactCanvas(true);
      }
    } catch (e) {
      console.error("Sync fallback error:", e);
    } finally {
      setIsResearching(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Simulates Google OAuth flow and retrieves authorized user state
    const mockUser = { id: 101, username: "Research Engineer", email: "user@google.com" };
    const mockToken = "google-oauth-token-nexus-2026";
    setUser(mockUser);
    setToken(mockToken);
    localStorage.setItem("nexus_jwt_token", mockToken);
    localStorage.setItem("nexus_user_info", JSON.stringify(mockUser));
    setShowAuthModal(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = authMode === "login" ? `${BACKEND_URL}/auth/login` : `${BACKEND_URL}/auth/register`;
    const payload = authMode === "login"
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword, username: authUsername };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || "Authentication failed");
        return;
      }

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("nexus_jwt_token", data.access_token);
      localStorage.setItem("nexus_user_info", JSON.stringify(data.user));
      setShowAuthModal(false);
    } catch (e) {
      setAuthError("Server connection error. Please ensure backend is running.");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("nexus_jwt_token");
    localStorage.removeItem("nexus_user_info");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      
      {/* Claude Style Header */}
      <header className="glass" style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-glow)" }}>
            <span style={{ color: "#FFF", fontSize: 18, fontWeight: 700 }}>✦</span>
          </div>
          <div>
            <span style={{ fontSize: 17, fontWeight: 700 }} className="claude-serif">Claude Research Assistant</span>
            <span style={{ fontSize: 11, background: "rgba(217, 119, 87, 0.12)", color: "var(--color-primary)", padding: "2px 8px", borderRadius: 6, marginLeft: 8, border: "1px solid rgba(217, 119, 87, 0.2)" }}>Anthropic Architecture</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {reportMarkdown && (
            <button
              onClick={() => setShowArtifactCanvas(!showArtifactCanvas)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: showArtifactCanvas ? "var(--color-primary)" : "var(--bg-tertiary)",
                color: showArtifactCanvas ? "#FFF" : "var(--text-primary)",
                border: "1px solid var(--border-primary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ✦ {showArtifactCanvas ? "Hide Artifact" : "View Artifact"}
            </button>
          )}

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg-tertiary)", padding: "5px 12px", borderRadius: 10, border: "1px solid var(--border-primary)" }}>
              <User size={15} color="var(--color-primary)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{user.username}</span>
              <button onClick={handleLogout} style={{ border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}>
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ padding: "7px 16px", borderRadius: 8, background: "var(--color-primary)", color: "#FFF", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace (Claude Split-Canvas View) */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: showArtifactCanvas ? "280px 1fr 1fr" : "280px 1fr", height: "calc(100vh - 61px)", overflow: "hidden" }}>
        
        {/* Left Sidebar */}
        <aside style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-primary)", padding: "18px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-tertiary)", display: "block", marginBottom: 10 }}>Research Projects</span>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="New project..."
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-primary)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 12, outline: "none" }}
              />
              <button onClick={handleCreateProject} style={{ padding: "6px 8px", borderRadius: 6, background: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer" }}>
                <FolderPlus size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div onClick={() => setSelectedProjectId(null)} style={{ padding: "7px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", background: selectedProjectId === null ? "var(--bg-tertiary)" : "transparent", color: selectedProjectId === null ? "var(--color-primary)" : "var(--text-primary)", fontWeight: selectedProjectId === null ? 600 : 400 }}>
                📁 General Workspace
              </div>
              {projects.map((p) => (
                <div key={p.id} onClick={() => setSelectedProjectId(p.id)} style={{ padding: "7px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer", background: selectedProjectId === p.id ? "var(--bg-tertiary)" : "transparent", color: selectedProjectId === p.id ? "var(--color-primary)" : "var(--text-primary)", fontWeight: selectedProjectId === p.id ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📂 {p.title}
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-primary)" }} />

          {/* Upload Document Context */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-tertiary)", display: "block", marginBottom: 8 }}>PDF Context</span>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px", borderRadius: 10, border: "1px dashed var(--border-secondary)", background: "var(--bg-primary)", cursor: "pointer", textAlign: "center" }}>
              <UploadCloud size={20} color="var(--color-primary)" style={{ marginBottom: 4 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{isUploading ? "Parsing..." : "Upload Document"}</span>
              <input type="file" accept=".pdf,.txt,.md" onChange={handleDocumentUpload} style={{ display: "none" }} />
            </label>
            {uploadedFileName && (
              <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={13} color="var(--color-success)" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFileName}</span>
              </div>
            )}
          </div>
        </aside>

        {/* Center Pane: Query Input & Real-time Reasoning */}
        <main style={{ padding: "24px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Query Prompt Card */}
          <div style={{ padding: "22px", borderRadius: 16, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
            <form onSubmit={handleRunDeepResearch}>
              <label style={{ display: "block", fontSize: 15, fontWeight: 600, marginBottom: 8 }} className="claude-serif">
                Research Inquiry
              </label>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Enter complex topic to investigate deeply..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isResearching}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-primary)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isResearching}
                  style={{ padding: "12px 24px", borderRadius: 10, background: isResearching ? "var(--bg-tertiary)" : "var(--color-primary)", color: "#FFF", border: "none", fontSize: 14, fontWeight: 600, cursor: isResearching ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {isResearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                  {isResearching ? "Analyzing..." : "Research"}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--text-secondary)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={includeAcademic} onChange={(e) => setIncludeAcademic(e.target.checked)} style={{ accentColor: "var(--color-primary)" }} />
                  <span>Search arXiv & PubMed Academic Repositories</span>
                </label>
              </div>
            </form>
          </div>

          {/* Deep Reasoning Collapsible Accordion ("Thought Process") */}
          {(isResearching || subQueries.length > 0) && (
            <div style={{ borderRadius: 14, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", overflow: "hidden" }}>
              <div
                onClick={() => setShowThoughtProcess(!showThoughtProcess)}
                style={{ padding: "12px 18px", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Brain size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Claude Reasoning & Execution Log</span>
                  {isResearching && <span style={{ fontSize: 11, color: "var(--color-primary)" }}>({progress}%)</span>}
                </div>
                {showThoughtProcess ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {showThoughtProcess && (
                <div style={{ padding: "16px 18px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 10, color: "var(--text-primary)", fontWeight: 500 }}>
                    {currentStep}
                  </div>

                  {subQueries.length > 0 && (
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)", display: "block", marginBottom: 6 }}>Decomposed Investigations:</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {subQueries.map((sq, i) => (
                          <div key={i} style={{ padding: "4px 8px", borderRadius: 6, background: "var(--bg-primary)", border: "1px solid var(--border-primary)", fontSize: 12 }}>
                            🔍 Sub-search [{i + 1}]: {sq}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inline Report Preview if Canvas is Closed */}
          {!showArtifactCanvas && reportMarkdown && (
            <div style={{ padding: "24px", borderRadius: 16, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }} className="claude-serif">Research Output</span>
                <button onClick={() => setShowArtifactCanvas(true)} style={{ padding: "4px 10px", borderRadius: 6, background: "var(--color-primary)", color: "#FFF", border: "none", fontSize: 12, cursor: "pointer" }}>
                  Open in Artifact Canvas ✦
                </button>
              </div>
              <MarkdownRenderer content={reportMarkdown} />
            </div>
          )}

        </main>

        {/* Right Pane: Claude Artifact Canvas */}
        {showArtifactCanvas && (
          <ClaudeArtifactCanvas
            reportMarkdown={reportMarkdown}
            sources={sources}
            evidenceMatrix={evidenceMatrix}
            query={query}
            onClose={() => setShowArtifactCanvas(false)}
          />
        )}
      </div>

      {/* Auth Modal with Sign in with Google */}
      {showAuthModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ width: 380, padding: 28, borderRadius: 20, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", position: "relative" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: "center", marginBottom: 4 }} className="claude-serif">
              {authMode === "login" ? "Sign In to Claude Assistant" : "Create Profile"}
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", marginBottom: 20 }}>
              Access persistent research projects & evidence history
            </p>

            {/* Sign in with Google Button */}
            <button
              onClick={handleGoogleSignIn}
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: 10,
                border: "1px solid var(--border-primary)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 16,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Globe size={18} color="#4285F4" />
              Sign in with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-primary)" }} />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Or Email</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-primary)" }} />
            </div>

            {authError && (
              <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#ef4444", fontSize: 12, marginBottom: 12 }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {authMode === "signup" && (
                <input
                  type="text"
                  placeholder="Username"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-input)", color: "var(--text-primary)", outline: "none", fontSize: 13 }}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-input)", color: "var(--text-primary)", outline: "none", fontSize: 13 }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-primary)", background: "var(--bg-input)", color: "var(--text-primary)", outline: "none", fontSize: 13 }}
              />
              <button type="submit" style={{ padding: "11px", borderRadius: 8, background: "var(--color-primary)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", marginTop: 4, fontSize: 14 }}>
                {authMode === "login" ? "Sign In" : "Register"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--text-secondary)" }}>
              {authMode === "login" ? "Need an account? " : "Already have an account? "}
              <button
                onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                style={{ border: "none", background: "transparent", color: "var(--color-primary)", cursor: "pointer", fontWeight: 600 }}
              >
                {authMode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </div>
            
            <button onClick={() => setShowAuthModal(false)} style={{ position: "absolute", top: 14, right: 14, border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
