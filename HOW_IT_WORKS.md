# RootCauseX — How It Works (Simple Guide)

> Written so that even after a long break, you can read this and fully understand what this project does, why it exists, and how every part works.

---

## What is RootCauseX?

RootCauseX is an **AI-powered GitHub Issue Triage Platform**.

In simple words:
- You give it any GitHub repository name (like `microsoft/vscode` or `your-username/your-repo`)
- It goes to that repository, reads all the open issues
- It automatically understands each issue, classifies it, checks if it was reported before, figures out the root cause, and writes a reply
- It shows you all of this in a clean dashboard

**The problem it solves:** Big open-source projects receive hundreds of issues every week. Maintainers spend hours just reading and labeling them. RootCauseX does that work automatically in seconds.

---

## Why Not Just Use GitHub's Built-in Issues?

GitHub already has an issues section — so why do we need RootCauseX?

Here is the honest comparison:

### GitHub Issues (what GitHub gives you)
- A list of issues
- You manually add labels (bug, enhancement, etc.)
- A search bar
- That's it

**You still have to:**
- Read every issue yourself
- Decide if it's a bug or feature request
- Figure out if someone already reported this before
- Understand what's causing the problem
- Write a reply yourself

### RootCauseX (what this app adds)
- Automatically classifies every issue as Bug / Security / Feature / Docs
- Automatically assigns severity: Critical / High / Medium / Low
- Detects duplicate issues using AI similarity (did someone report this before?)
- Diagnoses the root cause (what is actually causing this problem?)
- Writes a ready-to-post maintainer reply
- Flags issues that are good for new contributors
- Alerts you if a critical issue sits unresolved for 7 days
- Lets you ask questions like "Has this database timeout been fixed before?"
- Generates a code patch suggestion for the fix

**One line summary:**
> GitHub shows you *what* was reported. RootCauseX tells you *what it means*, *whether it's new*, *how serious it is*, and *what to do about it*.

---

## The Tech Stack (What Powers This App)

| Part | Technology | What it does |
|---|---|---|
| Backend | Java 21 + Spring Boot 3.4 | The main server that handles all logic |
| AI | Google Gemini 2.5 Flash | Understands and classifies issues |
| Vector Database | PostgreSQL + pgvector | Finds similar past issues using math |
| Cache | Redis 7 | Remembers results so we don't re-process the same issue |
| Frontend | React 19 + Vite + TypeScript | The UI you see in the browser |
| Charts | Recharts | The donut and bar charts in Analytics tab |
| Hosting | Render (backend) + Vercel (frontend) + Neon (database) | Where it runs online |

---

## How the Data Flows — Step by Step

### When you click "Sync & Analyze"

```
Step 1: App calls GitHub API
        → Fetches last 50 CLOSED issues (historical knowledge)
        → Fetches last 30 OPEN issues (to triage now)

Step 2: Closed issues → converted to vectors → stored in pgvector
        (This builds the "memory" of what problems were solved before)

Step 3: For each open issue:
        → Check Redis cache (did we already triage this?)
           YES → return cached result instantly
           NO  → continue to Step 4

Step 4: Search pgvector for similar past issues
        → If similarity score >= 0.88 → flag as DUPLICATE
        → Found the original resolved issue it matches

Step 5: Send to Gemini AI with context
        → AI returns: category, severity, component,
                      root cause hint, suggested reply

Step 6: Save result to PostgreSQL database
        Save to Redis cache (valid for 24 hours)

Step 7: Return to frontend → display in Triage Queue
```

### When you click an issue in the Triage Queue

The drawer (panel from the right) opens showing:
- AI Root-Cause Diagnosis with confidence score
- Duplicate detection (if it matches a past issue, with % similarity)
- Suggested maintainer reply (copy button to post on GitHub)
- Original issue description
- "Generate Patch" button → asks AI to write a code fix

### When you use "Ask Your Repo" (RAG Chat)

```
You type: "Has the HikariCP connection leak been fixed before?"

Step 1: Your question is converted to a vector
Step 2: pgvector searches for the most similar closed issues
Step 3: Those issues are sent to Gemini as context
Step 4: Gemini answers your question based only on those issues
Step 5: Answer appears with links to the actual GitHub issue numbers
```

### SLA Monitor (Stale Issues)

Every day at 9:00 AM the app automatically:
- Looks for CRITICAL or HIGH severity issues that are still OPEN
- If any issue is older than 7 days without being resolved
- Sends a Slack/Discord message (if `ALERT_WEBHOOK_URL` is set)
- Sends an email (if `MAIL_USERNAME` is set)
- You can also trigger this manually via the "SLA Monitor" button

---

## The Three Tabs Explained

### Tab 1 — Triage Queue
This is the main view. Shows all triaged issues with:
- **#number** badge → the GitHub issue number
- **Category badge** → Bug (orange) / Security (red) / Feature (violet) / Docs (grey)
- **Severity badge** → Critical / High / Medium / Low
- **Duplicate badge** → if it matches a past issue (with % match)
- **Good First badge** → if it's beginner-friendly
- **Diagnosis** → one-line AI root cause summary

Click any issue → drawer slides in with full details.

### Tab 2 — Engineering Intelligence
Shows analytics about the entire repository:
- How many issues were triaged
- Duplicate rate and hours saved
- Pie chart of issues by category (Bug vs Security vs Feature vs Docs)
- Bar chart of issues by severity
- Which components have the most defects (hotspots)
- Architectural Risk Score (0-100)
- Recurring defect clusters (same problem appearing multiple times)

### Tab 3 — Ask Your Repo (RAG Chat)
A chatbot that knows everything about your repository's issue history. Ask it:
- "What are common database connection issues?"
- "Were there any security vulnerabilities reported?"
- "Which issues are good for new contributors?"
- "How was the HikariCP deadlock resolved?"

It answers based only on your repository's actual closed issues — not general knowledge.

---

## The AI Layer — Two Modes

The app works with OR without an API key:

### Mock Mode (no API key needed)
- Uses a smart keyword classifier built into the app
- Detects: CVE/security/token → SECURITY CRITICAL
- Detects: timeout/HikariCP/connection → BUG CRITICAL
- Detects: typo/readme/docs → DOCS LOW
- Detects: feature/enhancement → FEATURE MEDIUM
- Uses a local mathematical vectorizer for similarity search
- **Completely free, works offline, no external calls**

### Live Mode (Gemini API key set)
- Full natural language understanding
- More accurate classification
- Better root cause diagnosis
- Better suggested replies
- Gemini 2.5 Flash is used for chat/triage
- Local semantic vectorizer is still used for embeddings (Gemini doesn't support OpenAI embedding format)

---

## The Duplicate Detection — How It Actually Works

This is the most technically interesting part.

Every closed issue is converted into a **1536-dimensional vector** (a list of 1536 numbers). Think of it as a mathematical "fingerprint" of the issue's meaning.

When a new issue arrives:
1. Its text is also converted to a 1536-dim vector
2. We calculate the **cosine similarity** between the new vector and all past vectors
3. Cosine similarity = how similar two vectors are (0.0 = completely different, 1.0 = identical)
4. If similarity >= **0.88** → flag as duplicate

**Why this works:** Two issues that describe the same problem in different words will have very similar vectors. Even if one says "app crashes with OutOfMemoryError" and another says "JVM heap exhaustion causing system failure" — both will have high similarity because the semantic meaning is the same.

---

## Environment Variables — What Each One Does

| Variable | Where to set | What it does |
|---|---|---|
| `AI_API_KEY` | Render | Your Gemini API key. Without this, app uses mock mode |
| `AI_MODEL` | Render | Which model to use. Set to `gemini-2.5-flash` |
| `GITHUB_TOKEN` | Render | GitHub PAT. Without this, only 60 API requests/hour |
| `SPRING_DATASOURCE_URL` | Render | Neon PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Render | Neon database username |
| `SPRING_DATASOURCE_PASSWORD` | Render | Neon database password |
| `REDIS_HOST` | Render | Redis server hostname |
| `REDIS_PORT` | Render | Redis port (default 6379) |
| `GITHUB_WEBHOOK_SECRET` | Render | Secret for GitHub webhook signature verification |
| `ALERT_WEBHOOK_URL` | Render | Slack/Discord webhook URL for SLA alerts |
| `ALERT_RECIPIENT_EMAIL` | Render | Email address for SLA alert emails |

---

## The GitHub Webhook — Real-Time Triage

Instead of clicking "Sync & Analyze" manually, you can configure GitHub to automatically notify RootCauseX whenever a new issue is opened.

How it works:
1. Someone opens a new issue on your GitHub repo
2. GitHub sends a POST request to `https://your-backend.render.com/api/v1/webhooks/github`
3. RootCauseX verifies the request is genuinely from GitHub (HMAC-SHA256 signature check)
4. Triage runs automatically in the background
5. By the time you open the app, the issue is already triaged

Setup: Go to GitHub repo → Settings → Webhooks → Add webhook → paste your backend URL.

---

## Deployment Architecture

```
User's Browser
     │
     │ HTTPS
     ▼
Vercel (Frontend — React app)
     │
     │ REST API calls (JSON)
     ▼
Render (Backend — Spring Boot Java server)
     │
     ├──► Neon (PostgreSQL + pgvector)
     │       • triaged_issues table (all results)
     │       • vector_store table (embeddings for similarity search)
     │
     ├──► Upstash Redis (Cache)
     │       • 24-hour cache of triage results
     │
     └──► GitHub API
             • Fetches issues from any public repository
```

---

## Common Questions

**Q: Why does it show 0 issues for my repo?**
A: Your repo has no open GitHub issues. Create one on GitHub and then click Sync & Analyze.

**Q: Why is it fetching spring-petclinic instead of my repo?**
A: Type your repo name in the sidebar input and press **Enter**.

**Q: The AI diagnosis looks basic — why?**
A: You're in mock mode (no `AI_API_KEY` set). Set your Gemini API key in Render environment variables for full AI.

**Q: GitHub rate limit error?**
A: Set `GITHUB_TOKEN` in Render with a Personal Access Token. This increases the limit from 60 to 5,000 requests/hour.

**Q: Database shows H2 instead of PostgreSQL?**
A: Your Neon credentials are wrong or missing. Check `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` in Render.

**Q: "Ask Your Repo" says no results?**
A: You need to run Sync first to build the knowledge base. The RAG chat only works after closed issues are indexed.

---

## What Makes This a Good Project to Show

1. **Full-stack** — Java backend + React frontend, both production deployed
2. **AI integration** — real Spring AI with structured output, not just a wrapper
3. **Vector search** — pgvector for semantic similarity, not just keyword search
4. **Caching** — Redis with TTL, cache-aside pattern
5. **Security** — HMAC-SHA256 webhook verification
6. **Async processing** — Java 21 Virtual Threads with @Async
7. **Resilience** — H2 fallback, in-memory vector store fallback, mock AI fallback
8. **RFC 7807** — proper error responses as ProblemDetail
9. **Scheduled jobs** — cron-based stale issue scanner with email/webhook alerts
10. **Real data** — works on actual GitHub repositories, not fake data

---

*Last updated: November 2026*
*Stack: Java 21 · Spring Boot 3.4 · Spring AI · pgvector · Redis · React 19 · Gemini 2.5 Flash*
