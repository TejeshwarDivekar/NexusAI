"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Compass,
  FileSearch,
  FolderKanban,
  FileText,
  Layers,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  History,
  Download,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

import { TopBar } from "./workspace/TopBar";
import { Sidebar, WorkspaceTab, ConversationSummary } from "./workspace/Sidebar";
import { CommandPalette } from "./workspace/CommandPalette";
import { KeyboardShortcutsModal } from "./workspace/KeyboardShortcutsModal";
import { ResearchComposer, ResearchScope } from "./workspace/ResearchComposer";
import { ResearchProgress } from "./workspace/ResearchProgress";
import { SourcesPanel, SourceData } from "./workspace/SourcesPanel";
import { EvidencePanel, EvidenceData } from "./workspace/EvidencePanel";
import { ContradictionViewer, ContradictionData } from "./workspace/ContradictionViewer";
import { ReportViewer } from "./workspace/ReportViewer";
import { EvidenceDetailView } from "./workspace/EvidenceDetailView";
import { SourceComparisonModal } from "./workspace/SourceComparisonModal";
import { DocumentUploadModal } from "./workspace/DocumentUploadModal";
import { ProjectManagerModal } from "./workspace/ProjectManagerModal";
import { AuthModal } from "./workspace/AuthModal";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { EmptyState } from "./ui/EmptyState";
import { Tabs } from "./ui/Tabs";

const BACKEND_URL = "/api/v1";

export function ResearchWorkspace() {
  const { data: session, status: sessionStatus } = useSession();

  // Navigation & Workspace State
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>("launchpad");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"evidence" | "contradictions">("evidence");
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState<"report" | "sources" | "evidence">("report");
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);

  // User Conversations State (Isolated per Login Account)
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Research Query & Configuration
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ResearchScope>({
    includeWeb: true,
    includeAcademic: true,
    includeDocuments: false,
  });
  const [depth, setDepth] = useState<"fast" | "standard" | "deep">("deep");

  // Execution State
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
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | undefined>(undefined);

  // Interactive Evidence Inspection State
  const [activeEvidence, setActiveEvidence] = useState<EvidenceData | null>(null);
  const [evidenceExplanationCache, setEvidenceExplanationCache] = useState<Record<string, string>>({});
  const [isLoadingEvidenceExplanation, setIsLoadingEvidenceExplanation] = useState(false);
  const [evidenceExplanationError, setEvidenceExplanationError] = useState<string | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
  const centerPanelRef = React.useRef<HTMLDivElement | null>(null);
  const mobileCenterPanelRef = React.useRef<HTMLDivElement | null>(null);

  // Real Database Projects & Ingested Documents
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ id: number; filename: string; charCount: number; chunksCount: number }[]>([]);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCompareSources, setSelectedCompareSources] = useState<SourceData[]>([]);

  // In-memory Client Cache for zero-latency tab switching and conversation navigation
  const conversationCache = React.useRef<Map<string, any>>(new Map());

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("nexus_jwt_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }, []);

  // Fetch authenticated user's conversations with timeout
  const fetchConversations = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/`, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }, [getAuthHeaders]);

  const fetchProjects = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${BACKEND_URL}/projects/`, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }, [getAuthHeaders]);

  const fetchDocuments = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${BACKEND_URL}/documents/`, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
    }
  }, [getAuthHeaders]);

  // Sync NextAuth Google session with backend database user
  useEffect(() => {
    let isMounted = true;
    const syncUser = async () => {
      if (session?.user && session.user.email) {
        try {
          const providerId = (session.user as any).id || session.user.email;
          const res = await fetch(`${BACKEND_URL}/auth/oauth_sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "google",
              provider_user_id: providerId,
              email: session.user.email,
              name: session.user.name || session.user.email.split("@")[0],
              profile_image: session.user.image || undefined,
            }),
          });
          if (res.ok && isMounted) {
            const data = await res.json();
            localStorage.setItem("nexus_jwt_token", data.access_token);
            localStorage.setItem("nexus_user_info", JSON.stringify(data.user));
          }
        } catch (e) {
          console.error("OAuth sync error:", e);
        }
      }
      if (isMounted) {
        fetchConversations();
        fetchProjects();
        fetchDocuments();
      }
    };

    syncUser();
    return () => {
      isMounted = false;
    };
  }, [session, fetchConversations, fetchProjects, fetchDocuments]);

  // Keyboard Shortcuts
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

  // Open a specific conversation with in-memory caching
  const handleSelectConversation = async (conversationId: string) => {
    try {
      let data = conversationCache.current.get(conversationId);
      if (!data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(`${BACKEND_URL}/conversations/${conversationId}`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          throw new Error("Conversation not found");
        }
        data = await res.json();
        conversationCache.current.set(conversationId, data);
      }

      setActiveConversationId(data.id);

      // Load latest research task if present in this conversation
      if (data.tasks && data.tasks.length > 0) {
        const latestTask = data.tasks[data.tasks.length - 1];
        setQuery(latestTask.query || "");
        setCurrentTaskId(latestTask.task_id);
        setReportMarkdown(latestTask.report_markdown || "");
        setSummary(latestTask.report_summary || "");
        setSources(latestTask.sources || []);
        setEvidenceMatrix(latestTask.evidence_matrix || []);
        setContradictions(latestTask.contradictions || []);
        setQualityScore(latestTask.quality_score || 90.0);
        setSourceDiversityScore(latestTask.source_diversity_score || 85.0);
        setEvidenceCoverageScore(latestTask.evidence_coverage_score || 90.0);
        setDocxDownloadUrl(latestTask.docx_download_url || `/api/v1/research/tasks/${latestTask.task_id}/document/download?format=docx`);
        setPdfDownloadUrl(latestTask.pdf_download_url || `/api/v1/research/tasks/${latestTask.task_id}/document/download?format=pdf`);
      } else if (data.messages && data.messages.length > 0) {
        const firstUserMsg = data.messages.find((m: any) => m.role === "user");
        setQuery(firstUserMsg ? firstUserMsg.content : data.title);
        setReportMarkdown("");
        setSummary("");
        setSources([]);
        setEvidenceMatrix([]);
        setContradictions([]);
        setCurrentTaskId(undefined);
        setDocxDownloadUrl(undefined);
        setPdfDownloadUrl(undefined);
      }

      setActiveEvidence(null);
      setEvidenceExplanationError(null);
      setErrorMessage(null);
      setIsLoading(false);
      setCurrentTab("workspace");
      setMobileWorkspaceView("report");
    } catch (err: any) {
      setErrorMessage(err.name === "AbortError" ? "Request timed out. Please retry." : err.message || "Failed to load conversation");
    }
  };

  // Create a new research conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setActiveEvidence(null);
    setEvidenceExplanationError(null);
    setQuery("");
    setReportMarkdown("");
    setSummary("");
    setSources([]);
    setEvidenceMatrix([]);
    setContradictions([]);
    setCurrentTaskId(undefined);
    setDocxDownloadUrl(undefined);
    setPdfDownloadUrl(undefined);
    setErrorMessage(null);
    setIsLoading(false);
    setCurrentTab("launchpad");
  };

  // Interactive Evidence Selection Handler
  const handleSelectEvidence = useCallback(async (evidence: EvidenceData) => {
    // 1. Save scroll position of center panel before opening evidence detail
    if (centerPanelRef.current) {
      setSavedScrollPosition(centerPanelRef.current.scrollTop);
    } else if (mobileCenterPanelRef.current) {
      setSavedScrollPosition(mobileCenterPanelRef.current.scrollTop);
    }

    // 2. Set active evidence and make sure center view is visible on mobile
    setActiveEvidence(evidence);
    setMobileWorkspaceView("report");

    // 3. Find matching source in sources list
    const matchingSource = sources.find((s) =>
      (evidence.citation_id && s.citation_id && evidence.citation_id === s.citation_id) ||
      (evidence.source_url && s.url && evidence.source_url === s.url) ||
      (evidence.source_title && s.title && evidence.source_title.toLowerCase() === s.title.toLowerCase())
    );

    // 4. Check cache for explanation
    const cacheKey = evidence.citation_id || evidence.claim || evidence.fact_snippet;
    if (evidenceExplanationCache[cacheKey]) {
      return;
    }

    // 5. Generate concise grounded explanation from backend
    setIsLoadingEvidenceExplanation(true);
    setEvidenceExplanationError(null);

    try {
      const res = await fetch("/api/v1/research/explain-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query || "Scientific Inquiry",
          claim: evidence.claim,
          fact_snippet: evidence.fact_snippet,
          source_title: matchingSource?.title || evidence.source_title,
          source_url: matchingSource?.url || evidence.source_url,
          source_authors: matchingSource?.authors?.join(", ") || (evidence as any).source_authors?.join(", "),
          source_year: matchingSource?.year ? String(matchingSource.year) : undefined,
          source_publisher: matchingSource?.publisher || matchingSource?.journal,
          citation_id: evidence.citation_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          setEvidenceExplanationCache((prev) => ({
            ...prev,
            [cacheKey]: data.explanation,
          }));
        }
      } else {
        setEvidenceExplanationError("Failed to load explanation from server");
      }
    } catch (err: any) {
      setEvidenceExplanationError(err?.message || "Error generating explanation");
    } finally {
      setIsLoadingEvidenceExplanation(false);
    }
  }, [sources, query, evidenceExplanationCache]);

  // Return from Evidence Detail to Normal Answer
  const handleBackToAnswer = useCallback(() => {
    setActiveEvidence(null);
    setEvidenceExplanationError(null);

    // Restore saved scroll position
    setTimeout(() => {
      if (centerPanelRef.current) {
        centerPanelRef.current.scrollTop = savedScrollPosition;
      }
      if (mobileCenterPanelRef.current) {
        mobileCenterPanelRef.current.scrollTop = savedScrollPosition;
      }
    }, 50);
  }, [savedScrollPosition]);

  // Delete a conversation (Strict Ownership)
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${conversationId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        conversationCache.current.delete(conversationId);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          handleNewConversation();
        }
      }
    } catch (e) {
      console.error("Delete conversation error:", e);
    }
  };

  // Run Real Research Investigation (Linked to User Conversation)
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
    setPdfDownloadUrl(undefined);
    setCurrentTab("workspace");
    setMobileWorkspaceView("report");

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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query: cleanQuery,
          conversation_id: activeConversationId || undefined,
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
      if (data.conversation_id) {
        setActiveConversationId(data.conversation_id);
      }
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
      setDocxDownloadUrl(data.docx_download_url || `/api/v1/research/tasks/${data.task_id}/document/download?format=docx`);
      setPdfDownloadUrl(data.pdf_download_url || `/api/v1/research/tasks/${data.task_id}/document/download?format=pdf`);
      setIsLoading(false);

      fetchConversations();
    } catch (err: any) {
      setIsLoading(false);
      setProgress(0);
      setErrorMessage(err.message || "An unexpected error occurred during real research execution.");
    }
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
        width: "100%",
      }}
    >
      {/* Top Navigation Bar */}
      <TopBar
        currentProjectTitle={currentProject.title}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onNewResearch={handleNewConversation}
        onOpenProjects={() => setIsProjectModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenLogin={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Responsive Left Sidebar Drawer with Real User Conversations */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setErrorMessage(null);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={handleNewConversation}
          onOpenUpload={() => setIsUploadOpen(true)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Center Canvas */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", width: "100%" }}>
          {/* VIEW 1: RESEARCH LAUNCHPAD */}
          {currentTab === "launchpad" && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div style={{ width: "100%", maxWidth: "860px", display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Hero Title */}
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <Badge variant="accent" size="sm" icon={<Sparkles size={12} />}>
                      Autonomous AI Research Assistant
                    </Badge>
                  </div>
                  <h1
                    style={{
                      fontSize: "26px",
                      fontWeight: 700,
                      letterSpacing: "-0.025em",
                      color: "var(--text-primary)",
                      lineHeight: 1.25,
                      marginBottom: "6px",
                    }}
                  >
                    What do you want to research?
                  </h1>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "640px" }}>
                    Enter any scientific or academic inquiry. Queries OpenAlex, PubMed, Europe PMC, and Crossref, extracts verified evidence, and generates an IEEE Word document (.docx).
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

                {/* User's Real Research Conversations from Database */}
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
                    <span>Your Research Inquiries ({conversations.length})</span>
                  </div>

                  {conversations.length === 0 ? (
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
                        No conversations yet.
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                        Ask a question above to perform your first real evidence-grounded research inquiry.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                      {conversations.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectConversation(item.id)}
                          style={{
                            padding: "14px 16px",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: activeConversationId === item.id ? "var(--bg-subtle)" : "var(--bg-surface)",
                            border: `1px solid ${activeConversationId === item.id ? "var(--accent-primary)" : "var(--border-primary)"}`,
                            boxShadow: "var(--shadow-xs)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "8px",
                            minHeight: "100px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent-primary)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = activeConversationId === item.id ? "var(--accent-primary)" : "var(--border-primary)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              <MessageSquare size={13} color="var(--accent-primary)" />
                              <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                                {item.title}
                              </h4>
                            </div>
                            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                              {item.message_count || 0} Messages • {new Date(item.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Badge variant="accent" size="sm">
                              {item.task_count ? `${item.task_count} Runs` : "Inquiry"}
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
              </div>
            </div>
          )}

          {/* VIEW 2: ADAPTIVE RESEARCH ROOM (3-Panel Desktop / Tabbed Mobile) */}
          {currentTab === "workspace" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", width: "100%" }}>
              {/* Mobile Segmented Tab Switcher (< 1024px) */}
              <div
                className="md-hide"
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-primary)",
                  backgroundColor: "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  width: "100%",
                }}
              >
                <Tabs
                  variant="segmented"
                  fullWidth
                  activeTab={mobileWorkspaceView}
                  onChange={(id) => setMobileWorkspaceView(id as any)}
                  tabs={[
                    { id: "report", label: "Answer" },
                    { id: "sources", label: "Sources", count: sources.length },
                    { id: "evidence", label: "Evidence", count: evidenceMatrix.length },
                  ]}
                />
              </div>

              {/* Main Panels Layout */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden", width: "100%" }}>
                {/* Left Panel: Sources Browser (300px on desktop) */}
                <div
                  className="mobile-hide"
                  style={{
                    width: "300px",
                    flexShrink: 0,
                    borderRight: "1px solid var(--border-primary)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <SourcesPanel
                    sources={sources}
                    onOpenCompare={(selected) => {
                      setSelectedCompareSources(selected);
                      setIsCompareModalOpen(true);
                    }}
                  />
                </div>

                {/* Center Panel: Research Synthesis / Answer Room */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    width: "100%",
                  }}
                >
                  {/* Mobile-only view switching */}
                  <div className="md-hide" style={{ flex: 1, overflowY: "auto" }}>
                    {mobileWorkspaceView === "sources" ? (
                      <SourcesPanel
                        sources={sources}
                        onOpenCompare={(selected) => {
                          setSelectedCompareSources(selected);
                          setIsCompareModalOpen(true);
                        }}
                      />
                    ) : mobileWorkspaceView === "evidence" ? (
                      <EvidencePanel
                        evidenceMatrix={evidenceMatrix}
                        activeCitationId={activeCitationId}
                        activeEvidence={activeEvidence}
                        onSelectEvidence={handleSelectEvidence}
                      />
                    ) : errorMessage ? (
                      <div style={{ padding: "20px", width: "100%" }}>
                        <div
                          style={{
                            padding: "16px",
                            borderRadius: "var(--radius-lg)",
                            backgroundColor: "var(--danger-subtle)",
                            border: "1px solid var(--danger-border)",
                            color: "var(--danger-text)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 650 }}>
                            <AlertCircle size={18} />
                            <span>Research Notice</span>
                          </div>
                          <p style={{ fontSize: "13px", lineHeight: 1.5, margin: 0 }}>
                            {errorMessage}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => setCurrentTab("launchpad")}>
                            Return to Launchpad
                          </Button>
                        </div>
                      </div>
                    ) : isLoading ? (
                      <div style={{ padding: "20px", width: "100%" }}>
                        <ResearchProgress
                          progressPercentage={progress}
                          currentStepDescription={statusMessage}
                          subQueries={subQueries}
                          sourcesCount={sources.length}
                        />
                      </div>
                    ) : activeEvidence ? (
                      <div ref={mobileCenterPanelRef} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <EvidenceDetailView
                          evidence={activeEvidence}
                          source={sources.find((s) =>
                            (activeEvidence.citation_id && s.citation_id && activeEvidence.citation_id === s.citation_id) ||
                            (activeEvidence.source_url && s.url && activeEvidence.source_url === s.url) ||
                            (activeEvidence.source_title && s.title && activeEvidence.source_title.toLowerCase() === s.title.toLowerCase())
                          )}
                          query={query}
                          explanation={evidenceExplanationCache[activeEvidence.citation_id || activeEvidence.claim || activeEvidence.fact_snippet]}
                          isLoadingExplanation={isLoadingEvidenceExplanation}
                          explanationError={evidenceExplanationError}
                          onBackToAnswer={handleBackToAnswer}
                        />
                      </div>
                    ) : reportMarkdown ? (
                      <div ref={mobileCenterPanelRef} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <ReportViewer
                          markdownContent={reportMarkdown}
                          summary={summary}
                          query={query}
                          taskId={currentTaskId}
                          docxDownloadUrl={docxDownloadUrl}
                          pdfDownloadUrl={pdfDownloadUrl}
                          sourcesCount={sources.length}
                          evidenceCount={evidenceMatrix.length}
                          qualityScore={qualityScore}
                          sourceDiversityScore={sourceDiversityScore}
                          evidenceCoverageScore={evidenceCoverageScore}
                          onCitationClick={(citationId) => {
                            setActiveCitationId(citationId);
                            setMobileWorkspaceView("evidence");
                          }}
                          onViewSources={() => setMobileWorkspaceView("sources")}
                          onViewEvidence={() => setMobileWorkspaceView("evidence")}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: "32px", width: "100%" }}>
                        <EmptyState
                          icon={<Sparkles size={20} />}
                          title="Ready to Investigate"
                          description="Enter a research question in the launchpad to search literature."
                          actionLabel="Go to Launchpad"
                          onAction={() => setCurrentTab("launchpad")}
                        />
                      </div>
                    )}
                  </div>

                  {/* Desktop view */}
                  <div className="mobile-hide" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                    ) : activeEvidence ? (
                      <div ref={centerPanelRef} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <EvidenceDetailView
                          evidence={activeEvidence}
                          source={sources.find((s) =>
                            (activeEvidence.citation_id && s.citation_id && activeEvidence.citation_id === s.citation_id) ||
                            (activeEvidence.source_url && s.url && activeEvidence.source_url === s.url) ||
                            (activeEvidence.source_title && s.title && activeEvidence.source_title.toLowerCase() === s.title.toLowerCase())
                          )}
                          query={query}
                          explanation={evidenceExplanationCache[activeEvidence.citation_id || activeEvidence.claim || activeEvidence.fact_snippet]}
                          isLoadingExplanation={isLoadingEvidenceExplanation}
                          explanationError={evidenceExplanationError}
                          onBackToAnswer={handleBackToAnswer}
                        />
                      </div>
                    ) : reportMarkdown ? (
                      <div ref={centerPanelRef} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <ReportViewer
                          markdownContent={reportMarkdown}
                          summary={summary}
                          query={query}
                          taskId={currentTaskId}
                          docxDownloadUrl={docxDownloadUrl}
                          pdfDownloadUrl={pdfDownloadUrl}
                          sourcesCount={sources.length}
                          evidenceCount={evidenceMatrix.length}
                          qualityScore={qualityScore}
                          sourceDiversityScore={sourceDiversityScore}
                          evidenceCoverageScore={evidenceCoverageScore}
                          onCitationClick={(citationId) => {
                            setActiveCitationId(citationId);
                            setRightPanelTab("evidence");
                          }}
                          onViewSources={() => {}}
                          onViewEvidence={() => setRightPanelTab("evidence")}
                        />
                      </div>
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
                </div>

                {/* Right Panel: Evidence Matrix (340px on desktop) */}
                <div
                  className="mobile-hide"
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
                      <EvidencePanel
                        evidenceMatrix={evidenceMatrix}
                        activeCitationId={activeCitationId}
                        activeEvidence={activeEvidence}
                        onSelectEvidence={handleSelectEvidence}
                      />
                    ) : (
                      <div style={{ padding: "14px" }}>
                        <ContradictionViewer contradictions={contradictions} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: PROJECTS MANAGER */}
          {currentTab === "projects" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
              <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
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
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
              <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
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
                          gap: "12px",
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

          {/* VIEW 5: REPORTS ARCHIVE */}
          {currentTab === "reports" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
              <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Research Reports & IEEE Papers Archive
                  </h2>
                  <p style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
                    Real historical research inquiries and IEEE Word documents (.docx) from database.
                  </p>
                </div>

                {conversations.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={20} />}
                    title="No reports generated yet"
                    description="Run your first research inquiry from the launchpad to create an evidence-grounded report and IEEE Word document."
                    actionLabel="Go to Launchpad"
                    onAction={() => setCurrentTab("launchpad")}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {conversations.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: "16px 18px",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-primary)",
                          boxShadow: "var(--shadow-xs)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                              <MessageSquare size={18} color="var(--accent-primary)" />
                              <h4 style={{ fontSize: "14.5px", fontWeight: 650, color: "var(--text-primary)" }}>
                                {item.title}
                              </h4>
                              <Badge variant="accent" size="sm">
                                {item.date_group || "Today"}
                              </Badge>
                            </div>
                            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                              {item.message_count || 0} Messages • Updated on {new Date(item.updated_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectConversation(item.id)}
                              style={{ minHeight: "36px" }}
                            >
                              Open Conversation
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          fetchConversations();
          fetchProjects();
        }}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewResearch={handleNewConversation}
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
