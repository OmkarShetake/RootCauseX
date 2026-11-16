# Requirements Document

## Introduction

RootCauseX already has a mature, fully implemented backend covering GitHub Client, Knowledge Sync, AI Triage, Duplicate Detection, Stale Scheduler, Analytics, Ask-Repo RAG, Demo Mode, Mock AI, and all associated frontend wiring.

This spec covers the **genuine missing delta** — the features described in the original prompt that are not yet present in the codebase:

1. Auto-Fix Code Patch Generator (new endpoint + service)
2. GitHub Webhook with HMAC-SHA256 signature verification (new endpoint + security verifier)
3. Email + Slack/Discord alert dispatching from the existing `StaleIssueScheduler`
4. Frontend patch panel inside `IssueDetailDrawer` (additive, zero layout changes)
5. Additional unit tests for new and existing components

## Glossary

- **CodePatchResponse** — structured AI output containing a file path, explanation, original snippet, patched snippet, and unified git diff
- **HMAC-SHA256** — hash-based message authentication using SHA-256, used by GitHub to sign webhook payloads
- **Virtual Thread** — Java 21 lightweight thread, enabled globally in this project via `spring.threads.virtual.enabled=true`
- **pgvector** — PostgreSQL extension for vector similarity search; already deployed in this project
- **Mock mode** — offline fallback mode where the AI layer uses a deterministic heuristic classifier; already implemented in `AiConfig`

## Requirements

### REQ-1: Auto-Fix Code Patch Generator

- [ ] 1. The system shall expose `POST /api/v1/repos/{owner}/{repo}/issues/{issueNumber}/generate-patch` returning a `CodePatchResponse` JSON body with HTTP 200.
- [ ] 2. The endpoint shall check a Redis cache key `rootcausex:patch:{owner}:{repo}:{issueNumber}` before invoking AI; a cache hit shall return the stored response without any external calls.
- [ ] 3. On cache miss, the service shall load the existing `TriagedIssue` from PostgreSQL; if no triage record exists, it shall triage the issue first by calling `IssueTriageService`.
- [ ] 4. The service shall fetch the most relevant Java source file from GitHub using the `component` field of the triage result to filter the repository file tree.
- [ ] 5. The service shall pass the issue details, root-cause hint, and source file content to `ChatClient` requesting structured `CodePatchResponse` output.
- [ ] 6. The `CodePatchResponse` record shall contain: `targetFile` (String), `explanation` (String), `originalSnippet` (String), `patchedSnippet` (String), `gitDiff` (String).
- [ ] 7. If source file retrieval fails or AI returns empty output, the service shall return a graceful `CodePatchResponse` with an `explanation` describing the limitation, never throwing an unhandled exception.
- [ ] 8. The result shall be stored in Redis with a 24-hour TTL after a successful AI call.
- [ ] 9. Mock AI mode (`AI_MOCK_MODE=true` or no API key) shall produce a realistic mock `CodePatchResponse` for demonstration.

### REQ-2: GitHub Webhook with HMAC-SHA256 Security

- [ ] 10. The system shall expose `POST /api/v1/webhooks/github` to receive GitHub webhook events.
- [ ] 11. If `GITHUB_WEBHOOK_SECRET` is not configured, the endpoint shall return HTTP 501 with a `ProblemDetail` body.
- [ ] 12. The endpoint shall validate the `X-Hub-Signature-256` header by computing `HmacSHA256(secret, rawBody)` and comparing using constant-time equality (`MessageDigest.isEqual`).
- [ ] 13. An invalid or missing signature shall result in HTTP 401 Unauthorized with a `ProblemDetail` body.
- [ ] 14. Only `issues` events with `action` = `opened` or `reopened` shall trigger triage; all other event types shall return HTTP 200 without processing.
- [ ] 15. Qualifying events shall dispatch triage asynchronously via `@Async`, returning HTTP 202 Accepted immediately without blocking on the AI call.
- [ ] 16. The HMAC verification logic shall live in a standalone `GitHubWebhookSignatureVerifier` component testable in isolation.

### REQ-3: Alert Dispatching from StaleIssueScheduler

- [ ] 17. When stale issues are found and `ALERT_WEBHOOK_URL` is configured, the scheduler shall POST a `{"text": "<summary>"}` JSON payload to that URL.
- [ ] 18. When stale issues are found, `MAIL_USERNAME`, `MAIL_PASSWORD`, and `ALERT_RECIPIENT_EMAIL` are all configured, the scheduler shall send a plain-text summary email via `JavaMailSender`.
- [ ] 19. Both alert channels shall be optional; when neither is configured the existing log-only behaviour is preserved and `mvn test` passes without any mail or webhook infrastructure.
- [ ] 20. `spring-boot-starter-mail` shall be added to `pom.xml`.

### REQ-4: Frontend Code Patch Panel

- [ ] 21. A "Generate Patch" button shall appear in the `IssueDetailDrawer` footer row using the identical CSS style as the existing "Re-Triage" button.
- [ ] 22. Clicking the button shall call `POST /api/v1/repos/{owner}/{repo}/issues/{issueNumber}/generate-patch` using owner/repo parsed from `issue.repoFullName`.
- [ ] 23. While the request is in-flight, the button shall show the existing `RotateCw animate-spin` spinner pattern.
- [ ] 24. When a patch response is received, a new section shall render below "Suggested Maintainer Response" showing `targetFile`, `explanation`, and `gitDiff` using existing design tokens and component styles.
- [ ] 25. `CodePatchResponse` shall be added to `frontend/src/types/index.ts` and `generatePatch` shall be added to `frontend/src/services/api.ts` following existing method patterns.
- [ ] 26. No existing layout, color scheme, typography, or component structure shall be modified.

### REQ-5: Test Coverage

- [ ] 27. A `GitHubWebhookSignatureVerifierTest` shall verify: valid HMAC passes, tampered body returns false, null header returns false.
- [ ] 28. `IssueTriageServiceTest` shall be extended with: a test verifying CVE-titled issues are classified as `SECURITY`/`CRITICAL`, and a test verifying body shorter than 30 chars yields `confidenceScore < 0.5`.
- [ ] 29. A `CodePatchServiceTest` shall verify: Redis cache hit bypasses AI/GitHub calls, Redis cache miss triggers AI and stores result in Redis.
- [ ] 30. All new tests shall use `@ExtendWith(MockitoExtension.class)` with no Spring context loading, consistent with existing test style.
- [ ] 31. `mvn test` shall pass with 0 failures and 0 errors after all changes.
