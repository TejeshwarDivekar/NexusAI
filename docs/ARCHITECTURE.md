# NexusResearch System Architecture

## Overview
NexusResearch is a full-stack, enterprise-grade AI research assistant engineered for scholarly inquiry, verifiable literature synthesis, interactive evidence exploration, and publication-ready IEEE Word (`.docx`) and academic PDF document generation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Next.js 16 App Router (Frontend)                   │
│  - Launchpad & Query Composer                                           │
│  - Research Workspace & Tabbed Center Panel                             │
│  - Interactive Evidence Matrix & Detail Inspector with Scroll Restoral │
│  - Document Downloader (IEEE Word & Academic PDF)                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    Reverse Proxy & /api/v1/... (SSE & REST)
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                       FastAPI 0.115 (Backend Core)                      │
│  - Lifespan Engine, Structured Logging & JWT / OAuth Sync              │
│  - 7-Stage Research Engine (classify, search, filter, extract, audit,   │
│    data analysis, synthesis)                                            │
│  - Academic PDF & IEEE Word Compilers with Citation Validation         │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
     ┌──────────────▼──────────────┐   ┌──────────────▼───────────────────┐
     │   PostgreSQL / SQLite DB    │   │      External APIs & Registry    │
     │ - Users & Active Projects   │   │ - OpenAlex, arXiv, PubMed        │
     │ - Conversations & Tasks     │   │ - Europe PMC, Crossref           │
     │ - Sources & Evidence Items  │   │ - DuckDuckGo & Wikipedia         │
     │ - Ingested Context Chunks   │   │ - Google Gemini LLM Engine       │
     └─────────────────────────────┘   └──────────────────────────────────┘
```

---

## 1. Frontend Architecture
- **Framework:** Next.js 16.3.1 (React 19, TypeScript 5).
- **Styling:** CSS variables design system with dark/light themes and modern glassmorphic accents.
- **Routing & Rendering:** Next.js App Router (`src/app/page.tsx`, `src/app/chat/page.tsx`, `src/app/login/page.tsx`).
- **Internal API Proxy:** `src/app/api/v1/[...path]/route.ts` securely proxies frontend calls to `BACKEND_INTERNAL_URL`.
- **State Management:** React hooks with persistent localStorage caching, interactive evidence selection, and seamless view restoration.

### Key Frontend Components
- **`ResearchWorkspace.tsx`:** Primary orchestration component managing research state, progress streaming, error tracking with task ID correlation, and retry triggers.
- **`EvidencePanel.tsx` & `EvidenceDetailView.tsx`:** Interactive evidence inspection matrix that loads quote citations and grounded explanations into the center view without permanent report replacement.
- **`ReportViewer.tsx`:** Markdown report viewer with citation pill badges, IEEE formatting, source diversity badges, and document download actions.
- **`ResearchComposer.tsx`:** Research query input bar with depth selection (`fast`, `standard`, `deep`) and source toggle filters.

---

## 2. Backend Architecture
- **Framework:** FastAPI (Python 3.10+) with Uvicorn server and AsyncIO.
- **Database Layer:** SQLAlchemy ORM with connection pooling, Alembic migration compatibility, and automatic schema initialization.
- **Security:** Passlib (bcrypt), PyJWT (HS256), and NextAuth OAuth profile synchronization.

### 7-Stage Research Pipeline (`ResearchEngine`)
1. **Query Classification & Cleaning:** Extracts formal topic titles and generates targeted sub-queries.
2. **Multi-Source Real Data Retrieval:** Concurrently queries OpenAlex, arXiv, PubMed, Europe PMC, Crossref, Wikipedia, and DuckDuckGo via `UnifiedSearchProvider`.
3. **Hard Relevance Gating:** Scores candidate sources against the query using `SourceRelevanceScorer` (lexical overlap, title tokens, semantic tiering) and filters low-confidence matches.
4. **Verified Evidence Extraction:** Extracts sentence-level quotes and maps specific claim classifications (`EvidenceService`).
5. **Contradiction Auditing:** Identifies empirical conflicts, differing conclusions, and methodological discrepancies (`ContradictionService`).
6. **Quantitative & Tabular Extraction:** Discovers numerical data points, percentages, and metrics (`DataAnalysisService`).
7. **Answer-First LLM Synthesis:** Formulates structured report with exact bracketed citations (`[1]`, `[2]`), short answer overview, key takeaways, and references (`GeminiProvider`).

---

## 3. Document Generation Pipeline
- **IEEE Word (`.docx`):** Built via `python-docx` (`IEEEDocumentGenerator`) adhering to standard academic structure: Title, Authors, Abstract, Index Terms, Introduction, Methodology, Findings, Numerical Comparison Table, Contradictions, Conclusion, and IEEE Reference List.
- **Academic PDF (`.pdf`):** Built via `reportlab` (`AcademicPDFGenerator`) with professional page headers, footers, pagination, and formal typography.
- **Citation Validation:** `CitationValidator` audits every cited claim against the reference bibliography before compiling the binary artifacts.

---

## 4. Multi-Tenant Data Isolation
Every user conversation, research project, source document, evidence matrix item, and generated file is scoped by `user_id` in the database:
- `projects.user_id`
- `conversations.user_id`
- `documents.user_id`
- `sources.user_id`
- `evidence_items.user_id`
- `research_tasks.user_id`

Cross-user resource access is strictly rejected at the database query level with `403 Forbidden` / `404 Not Found`.
