# Implementation Plan: RootCauseX

## System Architecture

```
[ Developer / Maintainer ]
         │
         ▼
[ React 18 + Vite + Tailwind CSS Frontend ] (Obsidian & Emerald/Amber Theme - No Blue)
         │  REST API (Virtual Threads / HTTP)
         ▼
[ Spring Boot 3.4+ Backend (com.rootcausex) ]
 ├── [ Security & Web MVC Config ] (CORS, RFC 7807 ProblemDetail Global Advice)
 ├── [ GitHubClientService ] ──(RestClient)──> [ GitHub REST API ]
 ├── [ KnowledgeSyncService ] ──(Spring AI Documents)──┐
 ├── [ IssueTriageService ]                            │
 │     ├── Step 1: Redis Cache Check                   │
 │     ├── Step 2: Vector Similarity (pgvector) <──────┘
 │     └── Step 3: ChatClient Structured Output (RootCauseAnalysis Record)
 ├── [ RepoChatService ] ──(RAG with pgvector similarity + citations)
 ├── [ RepoAnalyticsService ] ──(SQL Aggregations)
 └── [ StaleIssueScheduler ] ──(Scheduled cron + manual trigger)
         │
         ├── [ PostgreSQL 16 + pgvector ] (ACID relational data & vector embeddings)
         └── [ Redis 7 Cache ] (24-hour issue triage TTL)
```

## PostgreSQL Schema & Vector Store

1. **`vector_store` table** (managed by pgvector starter):
   - `id`: `UUID PRIMARY KEY`
   - `content`: `TEXT`
   - `metadata`: `JSONB` (contains `repoFullName`, `issueNumber`, `url`, `title`, `state`)
   - `embedding`: `vector(1536)` (or model dimension, e.g. 768 / 1536)

2. **`triaged_issues` table**:
   - `id`: `BIGSERIAL PRIMARY KEY`
   - `repo_full_name`: `VARCHAR(255) NOT NULL`
   - `issue_number`: `INTEGER NOT NULL`
   - `title`: `VARCHAR(500) NOT NULL`
   - `body`: `TEXT`
   - `author`: `VARCHAR(255)`
   - `state`: `VARCHAR(50)`
   - `category`: `VARCHAR(50) NOT NULL` (BUG, SECURITY, FEATURE, DOCS)
   - `severity`: `VARCHAR(50) NOT NULL` (CRITICAL, HIGH, MEDIUM, LOW)
   - `is_duplicate`: `BOOLEAN NOT NULL DEFAULT FALSE`
   - `duplicate_issue_number`: `INTEGER`
   - `similarity_score`: `DOUBLE PRECISION`
   - `is_good_first_issue`: `BOOLEAN NOT NULL DEFAULT FALSE`
   - `root_cause_hint`: `TEXT`
   - `suggested_reply`: `TEXT`
   - `github_created_at`: `TIMESTAMPTZ`
   - `triaged_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `html_url`: `VARCHAR(500)`
   - `labels`: `TEXT` (JSON or comma-separated)
   - `UNIQUE(repo_full_name, issue_number)`

## API Contracts

1. **Sync Knowledge Base**:
   - `POST /api/v1/repos/sync`
   - Request: `{ "owner": "spring-projects", "repo": "spring-petclinic" }`
   - Response: `{ "owner": "...", "repo": "...", "syncedCount": 35, "status": "COMPLETED", "message": "..." }`

2. **Issue Triage**:
   - `POST /api/v1/repos/{owner}/{repo}/triage`: Triages all open issues
   - `POST /api/v1/repos/{owner}/{repo}/issues/{issueNumber}/triage`: Triages single issue
   - `GET /api/v1/repos/{owner}/{repo}/issues`: Lists triaged issues with filter query params (`category`, `severity`, `isDuplicate`, `isGoodFirstIssue`, `search`)
   - Response: List of `TriagedIssueResponse`

3. **Ask Your Repo (RAG Chat)**:
   - `POST /api/v1/repos/{owner}/{repo}/ask`
   - Request: `{ "question": "What issues were found regarding database deadlocks or timeouts?" }`
   - Response: `{ "question": "...", "answer": "...", "citedIssues": [ { "issueNumber": 12, "title": "...", "url": "...", "similarity": 0.91 } ] }`

4. **Analytics**:
   - `GET /api/v1/repos/{owner}/{repo}/analytics`
   - Response: `{ "totalTriagedIssues": 40, "duplicatesCount": 6, "duplicateRate": 15.0, "goodFirstIssuesCount": 8, "estimatedHoursSaved": 15.0, "categoryBreakdown": {...}, "severityBreakdown": {...} }`

5. **Stale Critical Issue Alert Check**:
   - `POST /api/v1/alerts/check-stale`
   - Response: `{ "checkedCount": 18, "staleCriticalCount": 3, "alerts": [...] }`

## UI Component Structure (Obsidian & Emerald / Amber - Strictly No Blue)

- `src/`
  - `components/`
    - `Navbar.tsx` (Logo, Repo Selector / Chip presets, Sync button, Theme toggle)
    - `KpiMetrics.tsx` (Summary cards: Total, Duplicates caught + % time saved, Critical bugs, Good First Issues)
    - `TriageQueueTab.tsx` (Filters, Search, Card/Table views, Badge pills)
    - `IssueDetailDrawer.tsx` (Slide-over drawer with AI Root-Cause, Similar past issues, Copy maintainer reply)
    - `AnalyticsTab.tsx` (Recharts Donut Category Breakdown, Bar Severity Breakdown, Efficiency metrics)
    - `AskRepoTab.tsx` (Interactive RAG Chat with preset questions, streaming-like feedback, grounded citations)
    - `StaleAlertsModal.tsx` (Stale critical issues viewer & manual trigger)
  - `types/` (TypeScript interfaces matching backend DTOs)
  - `services/` (`api.ts` Axios/Fetch client)
  - `hooks/` (`useTheme.ts`, `useIssues.ts`)
  - `index.css` (Tailwind with custom obsidian, emerald, amber, coral, violet variables)

## Step-by-Step Implementation Strategy

1. **Infrastructure**:
   - Create `docker-compose.yml` for PostgreSQL 16 (`pgvector/pgvector:pg16`) and Redis (`redis:7-alpine`).
2. **Backend Foundation**:
   - Create root `pom.xml` with Spring Boot 3.4+, Spring AI, Spring Data JPA, Spring Data Redis, PostgreSQL, H2 (test/fallback), Lombok, Jackson.
   - Configure `application.yml` with virtual threads, pgvector, Redis, and fallback mock modes.
3. **Backend Packages & Classes**:
   - DTOs, Entities, Repositories, Exceptions + GlobalExceptionHandler.
   - GitHub Client Service using Spring modern RestClient.
   - Vector Store & Embedding config (supporting real pgvector + resilient in-memory fallback).
   - KnowledgeSyncService, IssueTriageService, RepoChatService, RepoAnalyticsService, StaleIssueScheduler.
   - REST Controllers.
4. **Backend Unit Tests**:
   - JUnit 5 + Mockito tests for `IssueTriageService` and `GitHubClientService`.
   - Verify build and tests pass via Maven.
5. **Frontend Implementation**:
   - Set up Vite + React + TypeScript + Tailwind CSS + Lucide Icons + Recharts.
   - Implement strict Obsidian & Emerald/Amber palette (zero blue).
   - Implement all 3 workspace tabs, slide-over drawer, command bar with quick chips, RAG chat with citations.
6. **End-to-End Verification**:
   - Run backend and frontend, test sync, triage, slide-over drawer, RAG chat, and analytics.
7. **Documentation**:
   - Comprehensive `README.md` with ASCII architecture, setup guide, curl commands, and design highlights.
