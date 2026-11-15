# RootCauseX ⚡
> **Intelligent GitHub Issue Triage, Duplicate Detection & Root-Cause Engine**
> Production-grade full-stack AI system built for high-throughput GitHub repository management.

[![Java](https://img.shields.io/badge/Java-21%2B%20(Virtual%20Threads)-007396?logo=openjdk&logoColor=white)](#)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4%2B-6DB33F?logo=springboot&logoColor=white)](#)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.0.0--M5-6DB33F?logo=spring&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL%2016-pgvector-336791?logo=postgresql&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-7%20Cache-DC382D?logo=redis&logoColor=white)](#)
[![React](https://img.shields.io/badge/React%2018-Vite%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](#)
[![Theme](https://img.shields.io/badge/Theme-Obsidian%20%26%20Emerald%2FAmber%20(No%20Blue)-10B981)](#)

---

## 🏛 System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│               RootCauseX Developer Workstation (Frontend)                   │
│   React 18 + Vite + TypeScript + Tailwind CSS (Obsidian & Emerald Theme)    │
│   • Command Bar & Presets  • Triage Queue  • Drawer  • Recharts  • RAG Chat │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST / JSON (HTTP)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 RootCauseX Spring Boot 3.4+ Backend Engine                  │
│                Package: com.rootcausex (Java 21 Virtual Threads)            │
├─────────────────────────────────────────────────────────────────────────────┤
│ ├── GitHubClientService (RestClient with Bearer Token & Rate-Limit Shield)  │
│ ├── KnowledgeSyncService (Spring AI Document Embeddings over Closed Issues) │
│ ├── IssueTriageService                                                      │
│ │     ├── Step 1: Redis Caching Layer (TTL 24h, Key: rootcausex:triage:...) │
│ │     ├── Step 2: Vector Similarity Search (Top-3 pgvector, Duplicate >= 88%)│
│ │     └── Step 3: LLM Structured Output (RootCauseAnalysis Java Record)     │
│ ├── RepoChatService (RAG QuestionAnswer Engine with Cited Issues)           │
│ ├── RepoAnalyticsService (SQL Aggregations: Categories, Severities, Rates)  │
│ └── StaleIssueScheduler (@Scheduled Cron: 0 0 9 * * * & Manual Trigger)     │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       ▼                               ▼
      ┌─────────────────────────────────┐   ┌────────────────────────────────┐
      │   PostgreSQL 16 + pgvector      │   │         Redis 7 Cache          │
      │ • triaged_issues (ACID Relational)│   │ • Key: rootcausex:triage:...   │
      │ • vector_store (HNSW & Cosine)  │   │ • 24h Expiration Policy        │
      └─────────────────────────────────┘   └────────────────────────────────┘
```

---

## 🚀 Key Architectural Features

1. **Java 21 Virtual Threads**:
   Enabled globally via `spring.threads.virtual.enabled=true` for non-blocking I/O throughput across GitHub API calls, pgvector embeddings, and LLM requests.
2. **Spring AI & Multi-Modal Resilience**:
   Supports Google Gemini and OpenAI-compatible models via standard environment variables (`AI_API_KEY`, `AI_MODEL`), paired with a robust deterministic local mock classifier for offline testing and rapid local execution.
3. **Single-Store ACID + Vectors (pgvector)**:
   Embeds resolved closed issues into PostgreSQL with `HNSW` index and cosine distance metric, enabling similarity search right alongside relational triage records.
4. **Three-Tier Intelligent Triage Pipeline**:
   - **Step 1:** Redis cache query to avoid duplicate LLM inferences within a 24-hour window.
   - **Step 2:** Vector similarity check flagging duplicates when similarity score $\ge 0.88$.
   - **Step 3:** Spring AI `ChatClient.entity(RootCauseAnalysis.class)` mapping to a strict Java 21 `Record`.
5. **Interactive "Ask Your Repo" RAG Chat**:
   Contextual vector query engine that answers questions about past bugs and links directly to cited issue numbers.
6. **Obsidian & Emerald/Amber Developer Workstation**:
   Strict non-blue dark/light theme designed for software engineers.

---

## 📦 Project Structure

```text
RootCauseX/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/rootcausex/
│       │   ├── RootCauseXApplication.java
│       │   ├── client/       # GitHub API DTOs (GitHubIssueDto, UserDto, LabelDto)
│       │   ├── config/       # AiConfig, CacheConfig, CorsConfig, DataSourceConfig, RestClientConfig, VectorStoreConfig
│       │   ├── controller/   # SyncController, TriageController, AskRepoController, AnalyticsController, AlertsController
│       │   ├── dto/          # RootCauseAnalysis record, KnowledgeSyncRequest/Response, etc.
│       │   ├── entity/       # TriagedIssue JPA entity
│       │   ├── exception/    # RFC 7807 GlobalExceptionHandler (ProblemDetail)
│       │   ├── repository/   # TriagedIssueRepository
│       │   ├── scheduler/    # StaleIssueScheduler (Cron + Manual Trigger)
│       │   └── service/      # GitHubClientService, KnowledgeSyncService, IssueTriageService, RepoChatService, RepoAnalyticsService
│       └── test/java/com/rootcausex/service/
│           ├── GitHubClientServiceTest.java
│           └── IssueTriageServiceTest.java
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, KpiMetrics, TriageQueueTab, IssueDetailDrawer, AnalyticsTab, AskRepoTab, StaleAlertsModal
│   │   ├── services/         # api.ts (REST client)
│   │   ├── types/            # TypeScript data contracts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml        # PostgreSQL 16 pgvector + Redis 7 alpine
└── init-db.sql               # Vector extension & table schema
```

---

## 🛠 Getting Started

### Prerequisites
- **Java 21+** (JDK 21 or JDK 23)
- **Node.js 18+** & npm
- **Maven 3.9+**
- *(Optional)* **Docker & Docker Compose** for containerized PostgreSQL + Redis

---

### Step 1: Start Infrastructure (Optional Containerized Mode)
```bash
docker-compose up -d
```
> *Note: RootCauseX features automatic self-healing resilience: if Docker is offline, it automatically switches to in-memory H2 (PostgreSQL compatibility mode) and in-memory caching so developers can run immediately!*

---

### Step 2: Run Backend
```bash
cd backend
mvn clean test
mvn spring-boot:run
```
The Spring Boot backend will start on **`http://localhost:8080`**.

#### Configuration Environment Variables (Optional):
```bash
# Optional: Set higher GitHub API rate limit (5,000 req/hr vs 60 unauthenticated)
export GITHUB_TOKEN="ghp_yourPersonalAccessToken"

# Optional: Set external LLM API key (OpenAI or Google Gemini)
export AI_API_KEY="sk-yourApiKey"
export AI_MODEL="gpt-4o-mini"
```

---

### Step 3: Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://127.0.0.1:5173`** in your browser. (The backend on `http://localhost:8080` also serves the unified compiled build).

---

## 📡 Sample API Curl Commands

### 1. Sync Historical Closed Issues (Vector Store Indexing)
```bash
curl -X POST http://localhost:8080/api/v1/repos/sync \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "spring-projects",
    "repo": "spring-petclinic"
  }'
```

### 2. Triage Repository Open Issues
```bash
curl -X POST http://localhost:8080/api/v1/repos/spring-projects/spring-petclinic/triage
```

### 3. Triage Single Issue by Number
```bash
curl -X POST http://localhost:8080/api/v1/repos/spring-projects/spring-petclinic/issues/2714/triage
```

### 4. Query Triaged Issues with Filtering
```bash
# Filter by severity and duplicates
curl "http://localhost:8080/api/v1/repos/spring-projects/spring-petclinic/issues?severity=CRITICAL&isDuplicate=true"

# Search by keyword
curl "http://localhost:8080/api/v1/repos/spring-projects/spring-petclinic/issues?search=timeout"
```

### 5. Repository Health Analytics
```bash
curl http://localhost:8080/api/v1/repos/spring-projects/spring-petclinic/analytics
```

### 6. Ask Your Repo (RAG Chat with Issue Citations)
```bash
curl -X POST http://localhost:8080/api/v1/repos/spring-projects/spring-petclinic/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What issues or vulnerabilities were discovered regarding dependencies?"
  }'
```

### 7. Trigger Stale Critical Issue Scan (Interview Demo Endpoint)
```bash
curl -X POST http://localhost:8080/api/v1/alerts/check-stale
```

---

## 🧪 Verification & Unit Tests
Run the automated test suite covering `IssueTriageService` (Redis cache hits, vector similarity duplicate triggers, documentation good-first classifications) and `GitHubClientService` (RestClient rate-limit handling and PR exclusions):

```bash
cd backend
mvn test
```
Result: **`Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS`**

---

## 🎨 Design Philosophy: "Obsidian & Emerald" (Strict Non-Blue)
- **Charcoal / Zinc Foundations**: `#09090B`, `#121215`, `#18181B` with 1px `#27272A` borders.
- **Emerald Accent (`#10B981`)**: Primary actions, sync triggers, active tab indicators, Good First Issue badges.
- **Warm Amber Accent (`#F59E0B`)**: Duplicate warnings and match percentage meters.
- **Coral / Crimson Accent (`#F43F5E`)**: Critical / Security alerts.
- **Violet Accent (`#8B5CF6`)**: AI root-cause diagnosis cards and RAG grounded citations.
