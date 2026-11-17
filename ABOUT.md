# RootCauseX — What It Is and How It Works

## Simple One-Line Answer

**RootCauseX is an AI assistant for GitHub issues.**  
You give it a GitHub repository, it reads all the open issues, and automatically tells you what each issue is, how serious it is, whether it was reported before, and what to reply.

---

## The Problem It Solves

When you have a GitHub repository, people open "issues" to report bugs, ask questions, or request features.

For small projects (5–10 issues) — easy to manage manually.  
For big projects (500+ issues) — a maintainer has to spend hours every day just reading and sorting them.

**Example:** The `spring-boot` repository has 52,000+ open issues. Every day 20–30 new ones arrive. Without a tool like RootCauseX, a human must read each one and decide:
- Is this a bug or a feature request?
- Is it critical or minor?
- Has someone already reported this exact problem before?
- What should I reply?

RootCauseX does all of this automatically in about 10 seconds per issue.

---

## What GitHub Issues Page Gives You (Built-in)

GitHub's issues tab is basically just a **list**. You get:
- A list of all issues
- A search bar
- Labels you assign manually (like "bug" or "enhancement")
- The ability to assign issues to team members

That's it. GitHub does not read the issue. GitHub does not tell you if it's critical. GitHub does not check if the same problem was reported 6 months ago. You have to do all of that yourself.

---

## What RootCauseX Does Differently

| What needs to happen | GitHub alone | RootCauseX |
|---|---|---|
| Classify as bug / security / feature / docs | You do it manually | Done automatically |
| Assign severity (Critical / High / Medium / Low) | You guess | AI decides based on the content |
| Check if same issue was reported before | You search manually | Vector similarity search — detects at 88% match |
| Understand the root cause | You read the code | AI diagnoses it |
| Write a reply to the reporter | You write it yourself | Ready-to-post reply is generated |
| Find easy issues for new contributors | You manually tag them | Automatically flagged as "Good First Issue" |
| Alert when critical issue is ignored for 7+ days | Nothing happens | Automatic alert via Slack or email |
| Ask "was this connection leak fixed before?" | Search through hundreds of old issues | AI chatbot answers in 2 seconds with links |
| Generate a code fix | Not possible | AI fetches the file and writes a patch |

---

## How the App Works — Step by Step

### Step 1: You enter a GitHub repository
You type `owner/repo` (example: `spring-projects/spring-petclinic`) in the sidebar and click **Sync & Analyze**.

### Step 2: Sync — building the knowledge base
The app fetches the last **50 closed (resolved) issues** from GitHub.  
These are stored as mathematical vectors in a database (pgvector).  
This is the "memory" — the app now knows what problems were solved before.

### Step 3: Triage — processing open issues
The app fetches the latest **30 open issues** from GitHub.  
For each issue, it runs a 3-step pipeline:

**Step 3a — Cache check**  
Has this issue been triaged before in the last 24 hours? If yes, return the cached result instantly. No AI call needed.

**Step 3b — Similarity search**  
Convert the issue text to a vector and search the knowledge base.  
If a past closed issue is 88% or more similar → flag as **Duplicate**.  
This means the same bug was already fixed — maintainer just needs to point to the old fix.

**Step 3c — AI classification**  
Send the issue to Gemini AI (or local heuristic if no API key).  
AI returns:
- Category: BUG / SECURITY / FEATURE / DOCS
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Component: which part of the code is affected (database, security, core, etc.)
- Root Cause: a technical explanation of why this is happening
- Suggested Reply: a polite, professional comment to post back on GitHub

### Step 4: Results shown in the UI
The Triage Queue shows all issues with color-coded badges, diagnosis cards, and a one-click copy reply button.

---

## The 6 Main Features

### 1. Triage Queue
Classified list of all open issues with severity badges, duplicate detection, and AI diagnosis.

### 2. Generate Code Patch
Click "Generate Patch" on any issue — the app fetches the relevant source file from GitHub and asks AI to write a code fix with a git diff.

### 3. Engineering Intelligence
Charts showing:
- Which parts of the code have the most bugs (component hotspots)
- Duplicate issue clusters (the same bug reported many times)
- Architectural risk score (0–100)

### 4. Ask Your Repo (RAG Chat)
Type any question like *"Has this HikariCP timeout been fixed before?"*  
The app searches the knowledge base and answers with citations to specific issue numbers.

### 5. SLA Monitor
Automatically checks every day at 9am: are there any CRITICAL or HIGH issues that have been open for more than 7 days without resolution?  
If yes → sends a Slack/Discord alert or email.

### 6. GitHub Webhook
When someone opens a new issue on GitHub, GitHub can automatically notify RootCauseX via a webhook. The issue gets triaged immediately in the background without anyone clicking anything.

---

## How the Tech Works (Simple Version)

```
User types repo name in sidebar
        ↓
App calls GitHub API → fetches issues
        ↓
Issues are converted to numbers (vectors) using AI math
        ↓
Those numbers are compared to past resolved issues
        ↓
If numbers are similar (≥88%) → Duplicate detected
        ↓
Remaining issues are sent to Gemini AI for classification
        ↓
Results are saved in PostgreSQL database
        ↓
Results are cached in Redis for 24 hours (so same issue is not re-processed)
        ↓
Frontend (React) shows the results with badges and cards
```

---

## Infrastructure (Where Everything Lives)

| Component | What it does | Where it runs |
|---|---|---|
| React frontend | The UI you see in the browser | Vercel |
| Spring Boot backend | The brain — processes everything | Render |
| PostgreSQL + pgvector | Stores issues and their vector embeddings | Neon DB |
| Redis | Caches results for 24 hours | Render (or Redis Cloud) |
| Gemini AI | Classifies issues and generates replies | Google AI API |
| GitHub API | Source of all issues | GitHub |

---

## Two Modes — Works With or Without AI Key

| Mode | When | What happens |
|---|---|---|
| Mock mode | No AI_API_KEY set | Uses a built-in keyword classifier (fast, free, offline) |
| Live mode | AI_API_KEY is set | Uses Gemini AI for deeper, more accurate analysis |

Both modes produce correct results. Mock mode uses pattern matching (if issue contains "CVE" → SECURITY/CRITICAL). Live mode uses actual AI understanding.

---

## Important Limits

- Fetches max **30 open issues** per sync (GitHub rate limit friendly)
- Fetches max **50 closed issues** for the knowledge base
- Without a GitHub token: 60 API requests/hour (shared IP limit)
- With a GitHub token: 5,000 API requests/hour
- Cache TTL: 24 hours (same issue is not re-triaged within 24 hours)
- Duplicate threshold: 88% cosine similarity

---

## In One Paragraph

RootCauseX connects to any GitHub repository, reads its open issues, and uses AI to automatically classify each one (bug/security/feature/docs), assign severity, check if the same problem was reported before, explain the technical root cause, and generate a ready-to-post maintainer reply. It also monitors for critical issues sitting unresolved for more than 7 days and sends alerts. The result is that a repository maintainer spends minutes instead of hours on issue triage, never misses a critical security report, and always has a consistent, professional response ready for every reporter.
