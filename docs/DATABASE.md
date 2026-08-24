# NexusResearch Database Architecture & Schema

## Overview
NexusResearch uses SQLAlchemy ORM with a unified schema supporting both **SQLite** (for local development and self-contained testing) and **PostgreSQL** (for production cloud deployments).

---

## 1. Relational Entity Models

```
┌───────────────┐
│     User      │
│  - id (PK)    │
│  - email      │◄─────────────────────────────┐
│  - name       │                              │
└───────┬───────┘                              │
        │ 1:N                                  │ 1:N
        ▼                                      │
┌───────────────┐        ┌───────────────┐     │
│    Project    │        │  UserDocument │     │
│  - id (PK)    │        │  - id (PK)    │     │
│  - user_id    │        │  - user_id    │─────┘
│  - name       │        │  - filename   │
└───────┬───────┘        │  - char_count │
        │ 1:N            └───────┬───────┘
        ▼                        │ 1:N
┌───────────────┐                ▼
│ Conversation  │        ┌───────────────┐
│  - id (PK)    │        │ DocumentChunk │
│  - user_id    │        │  - id (PK)    │
│  - project_id │        │  - doc_id     │
│  - title      │        │  - chunk_text │
└───────┬───────┘        └───────────────┘
        │ 1:N
        ▼
┌───────────────┐
│ ResearchTask  │
│  - id (PK)    │────────┬─────────────────────┐
│  - query      │        │ 1:N                 │ 1:N
│  - report_md  │        ▼                     ▼
│  - quality    │  ┌───────────────┐     ┌───────────────┐
└───────────────┘  │  SourceItem   │     │ EvidenceItem  │
                   │  - id (PK)    │     │  - id (PK)    │
                   │  - task_id    │     │  - task_id    │
                   │  - title      │     │  - claim      │
                   │  - url/doi    │     │  - quote      │
                   └───────────────┘     └───────────────┘
```

---

## 2. Table Specifications

### `users`
- `id` (Integer, Primary Key)
- `email` (String, Unique, Indexed)
- `name` (String, Nullable)
- `hashed_password` (String, Nullable)
- `is_active` (Boolean, Default: True)
- `created_at` (DateTime, UTC)

### `projects`
- `id` (Integer, Primary Key)
- `user_id` (Integer, ForeignKey `users.id`, Indexed)
- `name` (String)
- `description` (Text, Nullable)
- `created_at` (DateTime, UTC)

### `conversations`
- `id` (String, Primary Key, UUID)
- `user_id` (Integer, ForeignKey `users.id`, Indexed)
- `project_id` (Integer, ForeignKey `projects.id`, Nullable)
- `title` (String)
- `created_at` (DateTime, UTC)
- `updated_at` (DateTime, UTC)

### `research_tasks`
- `id` (String, Primary Key, UUID)
- `user_id` (Integer, ForeignKey `users.id`, Nullable, Indexed)
- `conversation_id` (String, ForeignKey `conversations.id`, Nullable)
- `query` (Text)
- `cleaned_topic` (String, Nullable)
- `depth` (String, Default: "deep")
- `status` (String, Default: "completed")
- `report_markdown` (Text)
- `report_summary` (Text, Nullable)
- `quality_score` (Float)
- `source_diversity_score` (Float)
- `evidence_coverage_score` (Float)
- `docx_file_path` (String, Nullable)
- `pdf_file_path` (String, Nullable)
- `created_at` (DateTime, UTC)

### `sources`
- `id` (Integer, Primary Key)
- `task_id` (String, ForeignKey `research_tasks.id`, Indexed)
- `user_id` (Integer, ForeignKey `users.id`, Nullable)
- `title` (String)
- `url` (String)
- `authors` (JSON / String)
- `publication_date` (String, Nullable)
- `source_type` (String, e.g. "academic_paper", "web")
- `citation_id` (String, e.g. "[1]")
- `reliability` (Float)
- `relevance_score` (Float)
- `snippet` (Text)

### `evidence_items`
- `id` (Integer, Primary Key)
- `task_id` (String, ForeignKey `research_tasks.id`, Indexed)
- `user_id` (Integer, ForeignKey `users.id`, Nullable)
- `claim` (Text)
- `fact_snippet` (Text)
- `citation_id` (String)
- `source_title` (String)
- `source_url` (String)
- `confidence_score` (Float)
- `classification` (String, e.g. "STATISTICAL", "EMPIRICAL", "THEORETICAL")

---

## 3. Database Initialization & Migrations
- The backend automatically executes `init_db()` upon application startup to ensure all tables, indexes, and constraints exist.
- Schema migrations can be managed via Alembic using `backend/alembic.ini`.
