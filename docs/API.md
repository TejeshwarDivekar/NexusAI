# NexusResearch API Reference

All backend API endpoints are versioned under the `/api/v1` prefix. Interactive Swagger/OpenAPI documentation is available at `http://127.0.0.1:8000/docs` when running the backend.

---

## 1. System Endpoints

### `GET /api/v1/health`
Health check endpoint returning system status, version, and database connectivity.
- **Response `200 OK`:**
  ```json
  {
    "app": "Enterprise AI Research Assistant API",
    "version": "1.0.0",
    "status": "healthy",
    "environment": "production",
    "database": "postgresql (connected)",
    "docs_url": "/api/v1/openapi.json"
  }
  ```

---

## 2. Research Endpoints

### `POST /api/v1/research/run`
Execute the multi-stage research pipeline for a query.
- **Request Body:**
  ```json
  {
    "query": "What are the latest developments in quantum computing?",
    "conversation_id": "optional-uuid",
    "project_id": 1,
    "include_academic": true,
    "include_web": true,
    "depth": "deep"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "task_id": "c47cdb8b-4934-4b6e-81d0-4dee89d2dc9b",
    "conversation_id": "conv-uuid",
    "query": "What are the latest developments in quantum computing?",
    "cleaned_topic": "Quantum Computing Developments",
    "status": "completed",
    "sub_queries": ["quantum error correction", "quantum supremacy"],
    "sources": [
      {
        "title": "Quantum Error Mitigation...",
        "url": "https://arxiv.org/abs/2301.00000",
        "citation_id": "[1]",
        "source_type": "academic_paper",
        "reliability": 0.95
      }
    ],
    "evidence_matrix": [
      {
        "claim": "Logical qubits showed suppression of physical error rates",
        "fact_snippet": "Demonstrated surface code scaling...",
        "citation_id": "[1]",
        "confidence_score": 0.96,
        "classification": "EMPIRICAL"
      }
    ],
    "contradictions": [],
    "report_markdown": "# Short Answer\n...",
    "report_summary": "Executive summary...",
    "quality_score": 94.0,
    "source_diversity_score": 90.0,
    "evidence_coverage_score": 95.0,
    "docx_download_url": "/api/v1/research/tasks/c47cdb8b.../document/download?format=docx",
    "pdf_download_url": "/api/v1/research/tasks/c47cdb8b.../document/download?format=pdf"
  }
  ```

### `GET /api/v1/research/stream`
Server-Sent Events (SSE) streaming endpoint providing stage-by-stage pipeline progress updates.
- **Query Parameters:** `query`, `depth`, `include_academic`, `include_web`.
- **SSE Events:** `{ "status": "searching", "step": "Stage 2/7: Querying...", "progress": 25 }`

### `POST /api/v1/research/explain-evidence`
Request a targeted LLM explanation for an evidence quote.
- **Request Body:**
  ```json
  {
    "evidence_quote": "Exact quoted sentence from research paper...",
    "query": "Original research query",
    "source_context": "Paper title and snippet"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "explanation": "This finding indicates that...",
    "source_title": "Paper title",
    "status": "success"
  }
  ```

### `GET /api/v1/research/tasks/{task_id}/document/download`
Download publication-grade research reports.
- **Query Parameters:** `format=docx` or `format=pdf`.
- **Response:** File attachment stream (`application/vnd.openxmlformats-officedocument.wordprocessingml.document` or `application/pdf`).

---

## 3. Project & Document Management

### `GET /api/v1/projects`
List all research projects for the authenticated user.

### `POST /api/v1/projects`
Create a new research project container.

### `POST /api/v1/documents/upload`
Upload and chunk user context documents (PDF, TXT, DOCX) to include in research queries.
- **Form Data:** `file` (multipart upload).
