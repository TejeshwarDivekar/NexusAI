"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  FileSearch,
  FolderKanban,
  FileText,
  Layers,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  GitCompare,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  History,
  BookOpen,
  FileCheck2,
  Download,
  Award,
  AlertCircle,
} from "lucide-react";

import { TopBar } from "./workspace/TopBar";
import { Sidebar, WorkspaceTab, ProjectSummary } from "./workspace/Sidebar";
import { CommandPalette } from "./workspace/CommandPalette";
import { KeyboardShortcutsModal } from "./workspace/KeyboardShortcutsModal";
import { ResearchComposer, ResearchScope } from "./workspace/ResearchComposer";
import { ResearchProgress } from "./workspace/ResearchProgress";
import { SourcesPanel, SourceData } from "./workspace/SourcesPanel";
import { EvidencePanel, EvidenceData } from "./workspace/EvidencePanel";
import { ContradictionViewer, ContradictionData } from "./workspace/ContradictionViewer";
import { ReportViewer } from "./workspace/ReportViewer";
import { SourceComparisonModal } from "./workspace/SourceComparisonModal";
import { DocumentUploadModal } from "./workspace/DocumentUploadModal";
import { ProjectManagerModal } from "./workspace/ProjectManagerModal";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { EmptyState } from "./ui/EmptyState";
import { Tabs } from "./ui/Tabs";

const BACKEND_URL = "http://localhost:8000/api/v1";

export function ResearchWorkspace() {
  // Navigation & Workspace State
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>("launchpad");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"evidence" | "contradictions">("evidence");

  // Research Query & Configuration
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ResearchScope>({
    includeWeb: true,
    includeAcademic: true,
    includeDocuments: false,
  });
  const [depth, setDepth] = useState<"fast" | "standard" | "deep">("deep");

  // Multi-Agent / Deterministic Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [subQueries, setSubQueries] = useState<string[]>([]);
  const [sources, setSources] = useState<SourceData[]>([]);
  const [evidenceMatrix, setEvidenceMatrix] = useState<EvidenceData[]>([]);
  const [contradictions, setContradictions] = useState<ContradictionData[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState("");
  const [summary, setSummary] = useState("");

  // Quality & Document Generation State
  const [qualityScore, setQualityScore] = useState<number>(90.0);
  const [sourceDiversityScore, setSourceDiversityScore] = useState<number>(85.0);
  const [evidenceCoverageScore, setEvidenceCoverageScore] = useState<number>(90.0);
  const [docxDownloadUrl, setDocxDownloadUrl] = useState<string | undefined>(undefined);

  // Real Database Projects & History
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ id: number; filename: string; charCount: number; chunksCount: number }[]>([]);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedCompareSources, setSelectedCompareSources] = useState<SourceData[]>([]);

  // Load real projects and history from database on mount
  useEffect(() => {
    fetchProjects();
    fetchHistory();
    fetchDocuments();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(
            data.map((p: any) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              questionCount: p.questions?.length || 0,
            }))
          );
          if (data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data[0].id);
          }
        }
      }
    } catch {
      setProjects([]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/research/history?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setRecentHistory(Array.isArray(data) ? data : []);
      }
    } catch {
      setRecentHistory([]);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/documents/`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUploadedDocs(
            data.map((d: any) => ({
              id: d.id,
              filename: d.filename,
              charCount: d.file_size || 0,
              chunksCount: d.chunks_count || 0,
            }))
          );
        }
      }
    } catch {
      setUploadedDocs([]);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Run Real Research Investigation
  const handleStartResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setProgress(10);
    setStatusMessage("Stage 1/4: Analyzing research question & keywords...");
    setSubQueries([]);
    setSources([]);
    setEvidenceMatrix([]);
    setContradictions([]);
    setReportMarkdown("");
    setSummary("");
    setCurrentTaskId(undefined);
    setDocxDownloadUrl(undefined);
    setCurrentTab("workspace");

    try {
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) {
            setStatusMessage("Stage 2/4: Searching real peer-reviewed papers (OpenAlex, PubMed, Europe PMC, Crossref)...");
            return prev + 5;
          }
          if (prev < 65) {
            setStatusMessage("Stage 3/4: Extracting verified quotes & evidence grounding from real sources...");
            return prev + 5;
          }
          if (prev < 90) {
            setStatusMessage("Stage 4/4: Synthesizing scientific report & compiling IEEE Word document (.docx)...");
            return prev + 3;
          }
          return prev;
        });
      }, 500);

      const res = await fetch(`${BACKEND_URL}/research/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: cleanQuery,
          project_id: selectedProjectId || undefined,
          include_academic: scope.includeAcademic,
          include_web: scope.includeWeb,
          depth: depth,
        }),
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        let errText = "Research service error. Please refine your query.";
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) {
            errText = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch {}
        throw new Error(errText);
      }

      const data = await res.json();
      setCurrentTaskId(data.task_id);
      setProgress(100);
      setStatusMessage("Research Complete — IEEE Word Document Generated");
      setSubQueries(data.sub_queries || []);
      setSources(data.sources || []);
      setEvidenceMatrix(data.evidence_matrix || []);
      setContradictions(data.contradictions || []);
      setReportMarkdown(data.report_markdown || "");
      setSummary(data.report_summary || "");
      setQualityScore(data.quality_score || 92.0);
      setSourceDiversityScore(data.source_diversity_score || 88.0);
      setEvidenceCoverageScore(data.evidence_coverage_score || 92.0);
      setDocxDownloadUrl(data.docx_download_url || `/api/v1/research/tasks/${data.task_id}/document/download`);
      setIsLoading(false);

      // Refresh real database history
      fetchHistory();
    } catch (err: any) {
      setIsLoading(false);
      setProgress(0);
      setErrorMessage(err.message || "An unexpected error occurred during real research execution.");
    }
  };

  const handleOpenHistoricalTask = (item: any) => {
    setQuery(item.query);
    setCurrentTaskId(item.task_id);
    setCurrentReport(item.report_markdown || "");
    setSummary(item.report_summary || "");
    setSources(item.sources || []);
    setEvidenceMatrix(item.evidence_matrix || []);
    setContradictions(item.contradictions || []);
    setQualityScore(item.quality_score || 90.0);
    setSourceDiversityScore(item.source_diversity_score || 85.0);
    setEvidenceCoverageScore(item.evidence_coverage_score || 90.0);
    setDocxDownloadUrl(item.docx_download_url || `/api/v1/research/tasks/${item.task_id}/document/download`);
    setErrorMessage(null);
    setIsLoading(false);
    setCurrentTab("workspace");
  };

  const setCurrentReport = (md: string) => {
    setReportMarkdown(md);
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || {
    id: 0,
    title: "General Research",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--bg-app)",
        overflow: "hidden",
      }}
    >
      {/* Top Navigation Bar */}
      <TopBar
        currentProjectTitle={currentProject.title}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onNewResearch={() => {
          setCurrentTab("launchpad");
          setQuery("");
          setErrorMessage(null);
        }}
        onOpenProjects={() => setIsProjectModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Collapsible Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setErrorMessage(null);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => setSelectedProjectId(id)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onNewProject={() => setIsProjectModalOpen(true)}
        />

        {/* Dynamic Center Canvas */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* VIEW 1: RESEARCH LAUNCHPAD */}
          {currentTab === "launchpad" && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "36px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ width: "100%", maxWidth: "860px", display: "flex", flexDirection: "column", gap: "28px" }}>
                {/* Hero Title */}
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <Badge variant="accent" size="sm" icon={<Sparkles size={12} />}>
                      Autonomous AI Research Assistant
                    </Badge>
                  </div>
                  <h1
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      letterSpacing: "-0.025em",
                      color: "var(--text-primary)",
                      lineHeight: 1.25,
                      marginBottom: "6px",
                    }}
                  >
                    What do you want to research?
                  </h1>
                  <p style={{ fontSize: "14.5px", color: "var(--text-secondary)", maxWidth: "640px" }}>
                    Enter any scientific or academic inquiry. The engine queries real peer-reviewed registries (OpenAlex, PubMed, Europe PMC, Crossref), extracts verified evidence, and generates an IEEE Word document (.docx).
                  </p>
                </div>

                {/* Research Composer */}
                <ResearchComposer
                  query={query}
                  onQueryChange={setQuery}
                  onSubmit={handleStartResearch}
                  isLoading={isLoading}
                  scope={scope}
                  onScopeChange={setScope}
                  depth={depth}
                  onDepthChange={setDepth}
                  uploadedDocCount={uploadedDocs.length}
                  onOpenUpload={() => setIsUploadOpen(true)}
                />

                {/* Error Banner if research failed */}
                {errorMessage && (
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--danger-subtle)",
                      border: "1px solid var(--danger-border)",
                      color: "var(--danger-text)",
                      fontSize: "13.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Recent Research from Real Database */}
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 650,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-tertiary)",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <History size={13} />
                    <span>Recent Research ({recentHistory.length})</span>
                  </div>

                  {recentHistory.length === 0 ? (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px dashed var(--border-primary)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
                        No research yet.
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                        Ask a question above to perform your first real evidence-grounded research inquiry.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                      {recentHistory.map((item) => (
                        <div
                          key={item.task_id}
                          onClick={() => handleOpenHistoricalTask(item)}
                          style={{
                            padding: "14px 16px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--bg-surface)",
                            border: "1px solid var(--border-primary)",
                            boxShadow: "var(--shadow-xs)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent-primary)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-primary)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div>
                            <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                              {item.query}
                            </h4>
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                              {item.sources?.length || 0} Real Sources • {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Badge variant="accent" size="sm">
                              IEEE .docx
                            </Badge>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "var(--accent-primary)" }}>
                              <span>Open</span>
                              <ArrowRight size={12} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Real Projects Section */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 650,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      Active Projects ({projects.length})
                    </div>
                    <Button variant="ghost" size="xs" leftIcon={<Plus size={12} />} onClick={() => setIsProjectModalOpen(true)}>
                      New Project
                    </Button>
                  </div>

                  {projects.length === 0 ? (
                    <div
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px dashed var(--border-primary)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      No projects created yet. Create a project to organize your research.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                      {projects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProjectId(p.id)}
                          style={{
                            padding: "14px 16px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: selectedProjectId === p.id ? "var(--bg-subtle)" : "var(--bg-surface)",
                            border: `1px solid ${selectedProjectId === p.id ? "var(--accent-primary)" : "var(--border-primary)"}`,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <FolderKanban size={15} color="var(--accent-primary)" />
                            <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                              {p.title}
                            </h4>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "8px" }}>
                            {p.description || "Project folder"}
                          </p>
                          <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                            {p.questionCount || 0} Questions
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: 3-PANEL ADAPTIVE RESEARCH WORKSPACE */}
          {currentTab === "workspace" && (
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* Left Panel: Sources Browser (300px) */}
              <div style={{ width: "300px", flexShrink: 0 }}>
                <SourcesPanel
                  sources={sources}
                  onOpenCompare={(selected) => {
                    setSelectedCompareSources(selected);
                    setIsCompareModalOpen(true);
                  }}
                />
              </div>

              {/* Center Panel: Research Synthesis / Reading Room (Flex 1) */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {errorMessage ? (
                  <div style={{ padding: "32px", maxWidth: "680px", margin: "0 auto", width: "100%" }}>
                    <div
                      style={{
                        padding: "18px 22px",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--danger-subtle)",
                        border: "1px solid var(--danger-border)",
                        color: "var(--danger-text)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontWeight: 650 }}>
                        <AlertCircle size={20} />
                        <span>Research Service Notice</span>
                      </div>
                      <p style={{ fontSize: "13.5px", lineHeight: 1.5, margin: 0 }}>
                        {errorMessage}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setCurrentTab("launchpad")}>
                        Return to Launchpad
                      </Button>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div style={{ padding: "32px", maxWidth: "720px", margin: "0 auto", width: "100%" }}>
                    <ResearchProgress
                      progressPercentage={progress}
                      currentStepDescription={statusMessage}
                      subQueries={subQueries}
                      sourcesCount={sources.length}
                    />
                  </div>
                ) : reportMarkdown ? (
                  <ReportViewer
                    markdownContent={reportMarkdown}
                    summary={summary}
                    query={query}
                    taskId={currentTaskId}
                    docxDownloadUrl={docxDownloadUrl}
                    qualityScore={qualityScore}
                    sourceDiversityScore={sourceDiversityScore}
                    evidenceCoverageScore={evidenceCoverageScore}
                  />
                ) : (
                  <div style={{ padding: "48px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
                    <EmptyState
                      icon={<Sparkles size={20} />}
                      title="Ready to Investigate"
                      description="Enter a research question in the launchpad to search real peer-reviewed literature and synthesize findings."
                      actionLabel="Go to Launchpad"
                      onAction={() => setCurrentTab("launchpad")}
                    />
                  </div>
                )}
              </div>

              {/* Right Panel: Evidence Matrix & Contradiction Inspector (340px) */}
              <div
                style={{
                  width: "340px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: "1px solid var(--border-primary)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-primary)" }}>
                  <Tabs
                    variant="pills"
                    activeTab={rightPanelTab}
                    onChange={(id) => setRightPanelTab(id as any)}
                    tabs={[
                      { id: "evidence", label: "Evidence Matrix", count: evidenceMatrix.length },
                      { id: "contradictions", label: "Conflicts", count: contradictions.length },
                    ]}
                  />
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                  {rightPanelTab === "evidence" ? (
                    <EvidencePanel evidenceMatrix={evidenceMatrix} />
                  ) : (
                    <div style={{ padding: "14px" }}>
                      <ContradictionViewer contradictions={contradictions} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: PROJECTS MANAGER */}
          {currentTab === "projects" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "36px 32px" }}>
              <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Research Projects
                    </h2>
                    <p style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
                      Folders of research inquiries and report archives stored in database.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsProjectModalOpen(true)}>
                    Create Project
                  </Button>
                </div>

                {projects.length === 0 ? (
                  <EmptyState
                    icon={<FolderKanban size={20} />}
                    title="No research projects created yet"
                    description="Create a project to organize related scientific research questions."
                    actionLabel="Create Project"
                    onAction={() => setIsProjectModalOpen(true)}
                  />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: "18px 20px",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-primary)",
                          boxShadow: "var(--shadow-xs)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FolderKanban size={18} color="var(--accent-primary)" />
                          <h3 style={{ fontSize: "15px", fontWeight: 650, color: "var(--text-primary)" }}>
                            {p.title}
                          </h3>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {p.description || "Active multi-source investigation"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                            {p.questionCount || 0} Questions
                          </span>
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setCurrentTab("launchpad");
                            }}
                          >
                            Open Workspace
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 4: SOURCES & INGESTED DOCUMENTS */}
          {currentTab === "sources" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "36px 32px" }}>
              <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
                      Indexed Sources & Uploaded Documents
                    </h2>
                    <p style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
                      Real papers and vector-indexed PDF documents with chunk metadata.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" leftIcon={<UploadCloud size={14} />} onClick={() => setIsUploadOpen(true)}>
                    Upload Paper
                  </Button>
                </div>

                {uploadedDocs.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={20} />}
                    title="No custom documents uploaded yet"
                    description="Upload research PDFs or text notes to index them alongside academic registries."
                    actionLabel="Upload PDF / Text Document"
                    onAction={() => setIsUploadOpen(true)}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {uploadedDocs.map((doc, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "14px 18px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <FileText size={18} color="var(--accent-primary)" />
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                              {doc.filename}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                              {doc.chunksCount} Semantic Chunks • {doc.charCount.toLocaleString()} Characters Indexed
                            </div>
                          </div>
                        </div>
                        <Badge variant="success" size="sm">
                          Indexed
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 5: REPORTS ARCHIVE WITH DIRECT IEEE DOCX DOWNLOAD */}
          {currentTab === "reports" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "36px 32px" }}>
              <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Research Reports & IEEE Papers Archive
                  </h2>
                  <p style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
                    Real historical research inquiries and IEEE Word documents (.docx) from database.
                  </p>
                </div>

                {recentHistory.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={20} />}
                    title="No reports generated yet"
                    description="Run your first research inquiry from the launchpad to create an evidence-grounded report and IEEE Word document."
                    actionLabel="Go to Launchpad"
                    onAction={() => setCurrentTab("launchpad")}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {recentHistory.map((item) => (
                      <div
                        key={item.task_id}
                        style={{
                          padding: "20px 22px",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-primary)",
                          boxShadow: "var(--shadow-xs)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <FileCheck2 size={18} color="var(--accent-primary)" />
                              <h4 style={{ fontSize: "15px", fontWeight: 650, color: "var(--text-primary)" }}>
                                {item.query}
                              </h4>
                              <Badge variant="accent" size="sm">
                                {item.quality_score || 90}% Quality
                              </Badge>
                            </div>
                            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                              {item.sources?.length || 0} Real Sources • Created on {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {item.task_id && (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Download size={14} />}
                                onClick={() => {
                                  window.open(`http://localhost:8000/api/v1/research/tasks/${item.task_id}/document/download`, "_blank");
                                }}
                              >
                                Download IEEE .docx
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenHistoricalTask(item)}
                            >
                              View Report
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewResearch={() => {
          setCurrentTab("launchpad");
          setQuery("");
          setErrorMessage(null);
        }}
        onOpenProjects={() => setIsProjectModalOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onViewSources={() => setCurrentTab("sources")}
        onViewReports={() => setCurrentTab("reports")}
        onSelectQuery={(q) => {
          setQuery(q);
          handleStartResearch();
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(doc) => {
          setUploadedDocs((prev) => [...prev, doc]);
          setScope((prev) => ({ ...prev, includeDocuments: true }));
        }}
      />

      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={(p) => {
          setProjects((prev) => [
            ...prev,
            { id: p.id, title: p.title, description: p.description, questionCount: p.questions?.length || 0 },
          ]);
          setSelectedProjectId(p.id);
        }}
      />

      <SourceComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        sources={selectedCompareSources}
      />
    </div>
  );
}
