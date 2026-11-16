# Implementation Plan: RootCauseX Delta Features

## Overview

19 tasks implementing the four missing features: Code Patch Generator, GitHub Webhook + HMAC security, Stale Alert dispatching, and the frontend patch panel. All existing code, endpoints, and frontend layout are preserved. Tasks are ordered so each task's dependencies are complete before it starts.

## Tasks

- [ ] 1. Add `spring-boot-starter-mail` dependency to `backend/pom.xml`
  - Open `backend/pom.xml` and insert `<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-mail</artifactId></dependency>` inside `<dependencies>`.
  - Verify `mvn dependency:resolve` resolves the artifact without errors.
  - **Acceptance**: `pom.xml` compiles cleanly; no classpath conflicts with existing Spring Boot 3.4.1 parent.

- [ ] 2. Create `CodePatchResponse` DTO record
  - Create `backend/src/main/java/com/rootcausex/dto/CodePatchResponse.java` as a Java record with five `String` fields: `targetFile`, `explanation`, `originalSnippet`, `patchedSnippet`, `gitDiff`.
  - Add `@JsonPropertyDescription` annotations on each field matching the same pattern used in the existing `RootCauseAnalysis` record.
  - **Acceptance**: File compiles; record is a pure value type with no JPA annotations.

- [ ] 3. Create `GitHubContentsDto` and `GitHubSourceFile` client records
  - Create `backend/src/main/java/com/rootcausex/client/GitHubContentsDto.java` as a Jackson-annotated record: fields `name`, `path`, `type`, `content`, `encoding`, plus `downloadUrl` mapped via `@JsonProperty("download_url")`.
  - Create `backend/src/main/java/com/rootcausex/client/GitHubSourceFile.java` as a plain record with two `String` fields: `path`, `content`.
  - **Acceptance**: Both records compile; `GitHubContentsDto` deserializes correctly from a sample GitHub API JSON response.

- [ ] 4. Add `fetchBestSourceFile` method to `GitHubClientService`
  - Add method `public GitHubSourceFile fetchBestSourceFile(String owner, String repo, String component)` to the existing `GitHubClientService`.
  - Implementation: call `GET /repos/{owner}/{repo}/contents/src/main/java` via the existing `restClient`; deserialize to `List<GitHubContentsDto>`; find first entry whose `path` contains `component` (case-insensitive). If not found, retry with root path `""`. Fetch the matched file's content, Base64-decode using `java.util.Base64.getMimeDecoder()` (strip `\n` before decoding). Return `GitHubSourceFile(path, decoded)`.
  - Wrap every step in try/catch; on any failure return `new GitHubSourceFile("unknown", "Source file unavailable.")` — never throw.
  - **Acceptance**: Method returns a `GitHubSourceFile` with non-null fields; no exception propagates on 404 or rate-limit responses.

- [ ] 5. Extend mock AI (`AiConfig.IntelligentMockChatModel`) to handle patch requests
  - In `AiConfig.IntelligentMockChatModel.call()`, add detection **before** the existing category classification: if the prompt text (lowercased) contains `"targetfile"` or `"gitdiff"` or `"generate a code patch"`, produce a `CodePatchResponse` JSON and return it wrapped in `ChatResponse`.
  - Use the mock values specified in design §Mock AI extension.
  - **Acceptance**: Calling the mock model with a patch-style prompt returns valid `CodePatchResponse` JSON; existing triage prompts are unaffected.

- [ ] 6. Create `CodePatchService`
  - Create `backend/src/main/java/com/rootcausex/service/CodePatchService.java` with `@Service`.
  - Constructor-inject: `TriagedIssueRepository`, `IssueTriageService`, `GitHubClientService`, `ChatClient`, `RedisTemplate<String, Object>`, `ObjectMapper`. Add `@Value("${rootcausex.cache.triage-ttl-hours:24}")` for TTL.
  - Implement `public CodePatchResponse generatePatch(String owner, String repo, int issueNumber)` per the design sequence: Redis check → load/triage issue → fetch source file → build prompt → call ChatClient → Redis store → return.
  - Graceful fallback: if ChatClient returns null or throws, return `new CodePatchResponse("unknown", "Patch generation requires a live AI API key and an accessible source file.", "", "", "")`.
  - **Acceptance**: Returns a non-null `CodePatchResponse`; works in mock mode without any external API key; Redis caches the result.

- [ ] 7. Create `PatchController`
  - Create `backend/src/main/java/com/rootcausex/controller/PatchController.java` with `@RestController` and `@RequestMapping("/api/v1/repos")`.
  - Add `@PostMapping("/{owner}/{repo}/issues/{issueNumber}/generate-patch")` delegating to `CodePatchService.generatePatch()` and returning `ResponseEntity.ok(response)`.
  - **Acceptance**: `POST /api/v1/repos/spring-projects/spring-petclinic/issues/201/generate-patch` returns HTTP 200 with a `CodePatchResponse` JSON body.

- [ ] 8. Add `webhook.secret` and alert config to `application.yml`
  - Add under `rootcausex:` in `backend/src/main/resources/application.yml`:
    ```yaml
    webhook:
      secret: ${GITHUB_WEBHOOK_SECRET:}
    alerts:
      webhook-url: ${ALERT_WEBHOOK_URL:}
      recipient-email: ${ALERT_RECIPIENT_EMAIL:}
    ```
  - Add Spring Mail configuration block:
    ```yaml
    spring:
      mail:
        host: ${MAIL_HOST:smtp.gmail.com}
        port: ${MAIL_PORT:587}
        username: ${MAIL_USERNAME:}
        password: ${MAIL_PASSWORD:}
        properties:
          mail.smtp.auth: true
          mail.smtp.starttls.enable: true
    ```
  - **Acceptance**: Application starts without errors when none of the new env vars are set.

- [ ] 9. Create `GitHubWebhookSignatureVerifier`
  - Create `backend/src/main/java/com/rootcausex/security/GitHubWebhookSignatureVerifier.java` as an `@Component`.
  - Implement `public boolean verify(String secret, byte[] body, String signatureHeader)`:
    - Return `false` immediately if `secret` or `signatureHeader` is null or blank.
    - Compute `Mac.getInstance("HmacSHA256")`, init with `SecretKeySpec(secret.getBytes(UTF_8), "HmacSHA256")`, call `doFinal(body)`.
    - Hex-encode result with lowercase hex chars, prepend `"sha256="`.
    - Return `MessageDigest.isEqual(expected.getBytes(UTF_8), signatureHeader.getBytes(UTF_8))`.
  - **Acceptance**: Returns `true` for a matching payload/signature; returns `false` for a tampered body; returns `false` for a null header; never throws.

- [ ] 10. Add `@EnableAsync` to `RootCauseXApplication` and `triageIssueAsync` to `IssueTriageService`
  - Add `@EnableAsync` annotation to `RootCauseXApplication.java`.
  - Add `@Async` method `public void triageIssueAsync(String owner, String repo, int issueNumber)` to `IssueTriageService`: wraps `triageIssue()` in try/catch with INFO/ERROR logging.
  - **Acceptance**: Calling `triageIssueAsync()` returns immediately; triage executes on a separate Virtual Thread.

- [ ] 11. Create `WebhookController`
  - Create `backend/src/main/java/com/rootcausex/controller/WebhookController.java` with `@RestController` and `@RequestMapping("/api/v1/webhooks")`.
  - Inject `GitHubWebhookSignatureVerifier`, `IssueTriageService`, `ObjectMapper`. Add `@Value("${rootcausex.webhook.secret:}")`.
  - Implement `@PostMapping("/github")` with `@RequestBody byte[] rawBody`, `@RequestHeader` params for `X-Hub-Signature-256` and `X-GitHub-Event`.
  - Logic per design §WebhookController: 501 if secret blank, 401 if signature invalid, 200 for non-issues events, 202 + async triage for `opened`/`reopened` issues.
  - All error responses use `ProblemDetail` matching the existing `GlobalExceptionHandler` format (title, type URI, timestamp, path).
  - **Acceptance**: Valid signature + issues.opened → 202; invalid signature → 401; ping event → 200; no secret → 501.

- [ ] 12. Extend `StaleIssueScheduler` with alert dispatching
  - Add `@Autowired(required=false) JavaMailSender mailSender` field.
  - Add `RestClient restClient` to constructor (the existing `RestClient` bean from `RestClientConfig`).
  - Add `@Value` fields for `${rootcausex.alerts.webhook-url:}` and `${rootcausex.alerts.recipient-email:}`.
  - After computing `StaleCheckResponse` in `checkStaleIssues()`, if `alerts.size() > 0`: dispatch Slack/Discord webhook POST if URL non-blank; dispatch email if `mailSender != null` and recipient non-blank. Both wrapped in try/catch.
  - **Acceptance**: When no alert env vars are set, existing log-only behaviour is unchanged; `mvn test` still passes; no `NullPointerException` when `mailSender` is not in context.

- [ ] 13. Update `.env.example` with new environment variables
  - Append to `.env.example` at root:
    ```
    # GitHub Webhook
    GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

    # Alert Notifications (optional)
    ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
    ALERT_RECIPIENT_EMAIL=team@yourcompany.com
    MAIL_HOST=smtp.gmail.com
    MAIL_PORT=587
    MAIL_USERNAME=alerts@yourcompany.com
    MAIL_PASSWORD=your_app_password
    ```
  - **Acceptance**: File contains all new variables with descriptive comments.

- [ ] 14. Add `CodePatchResponse` to frontend types
  - Add at the end of `frontend/src/types/index.ts`:
    ```typescript
    export interface CodePatchResponse {
      targetFile: string;
      explanation: string;
      originalSnippet: string;
      patchedSnippet: string;
      gitDiff: string;
    }
    ```
  - **Acceptance**: TypeScript compilation succeeds; no changes to any existing interface.

- [ ] 15. Add `generatePatch` to frontend API service
  - Add `generatePatch` async method to `frontend/src/services/api.ts` following the exact pattern of existing methods (same `getAuthHeaders()` call, same `fetch`, same error handling).
  - Signature: `async generatePatch(owner: string, repo: string, issueNumber: number): Promise<CodePatchResponse>`.
  - URL: `` `${BASE_URL}/repos/${owner}/${repo}/issues/${issueNumber}/generate-patch` `` with `method: 'POST'`.
  - **Acceptance**: TypeScript compilation succeeds; no changes to any existing method.

- [ ] 16. Add "Generate Patch" UI to `IssueDetailDrawer`
  - Import `CodePatchResponse` from types and `api` from services in `IssueDetailDrawer.tsx`.
  - Add two state variables: `patch` (`CodePatchResponse | null`, init `null`) and `patchLoading` (`boolean`, init `false`). Reset both to initial values when `issue` prop changes (add `useEffect([issue])` that calls `setPatch(null)`).
  - Add `handleGeneratePatch` async function: parse `[owner, repo]` from `issue.repoFullName.split('/')`, call `api.generatePatch(owner, repo, issue.issueNumber)`, set `patch` on success, call `onToast` on error.
  - Add "Generate Patch" button in the footer row immediately before the existing "Re-Triage" button, using identical styling (`bg-card`, `border`, `text-primary`, `rounded-lg`, `text-xs font-medium`, `px-3 py-1.5`). Show `RotateCw animate-spin` icon while `patchLoading` is true.
  - After the "Suggested Maintainer Response" section, conditionally render a patch result card when `patch` is non-null: use the same `rounded-xl`, `border`, `bg-canvas` card style as the "Original Issue Report" section. Show `targetFile` as a `font-mono text-xs` path label, `explanation` as `text-xs` prose, `gitDiff` in a `<pre className="font-mono text-xs overflow-x-auto">` block.
  - **Acceptance**: Button appears for every triaged issue; patch renders correctly when API responds; existing drawer layout, colors, and all other sections are unaffected; TypeScript compilation succeeds.

- [ ] 17. Write `GitHubWebhookSignatureVerifierTest`
  - Create `backend/src/test/java/com/rootcausex/security/GitHubWebhookSignatureVerifierTest.java`.
  - `@ExtendWith(MockitoExtension.class)`, instantiate `GitHubWebhookSignatureVerifier` directly (no mocks needed).
  - Test 1 `verifyValidSignature_returnsTrue`: compute real HMAC-SHA256 of a known payload + secret in the test, assert `verify()` returns `true`.
  - Test 2 `verifyTamperedBody_returnsFalse`: use the signature from test 1 but pass a different body, assert `false`.
  - Test 3 `verifyMissingHeader_returnsFalse`: call `verify(secret, body, null)`, assert `false` without exception.
  - **Acceptance**: All 3 tests pass; `mvn test` shows 0 failures.

- [ ] 18. Extend `IssueTriageServiceTest` and write `CodePatchServiceTest`
  - In existing `IssueTriageServiceTest.java`, add:
    - `shouldClassifySecurityIssueAsCritical`: issue title `"CVE-2024-1234: RCE in auth filter"`, assert `category=SECURITY`, `severity=CRITICAL`.
    - `shouldAssignLowConfidenceForSparseDescription`: issue body `"crash"` (5 chars), assert `confidenceScore < 0.5`.
  - Create `backend/src/test/java/com/rootcausex/service/CodePatchServiceTest.java` with `@ExtendWith(MockitoExtension.class)`:
    - `shouldReturnCachedPatchOnRedisHit`: mock `valueOperations.get(key)` returning a pre-built `CodePatchResponse`, assert returned response equals cached value, verify no calls to `ChatClient` or `GitHubClientService`.
    - `shouldCallAiAndCacheOnCacheMiss`: mock Redis miss, mock `TriagedIssueRepository` returning a `TriagedIssue`, mock `GitHubClientService.fetchBestSourceFile()`, mock `ChatClient` chain returning a `CodePatchResponse`, assert `valueOperations.set()` is called with the correct key prefix.
  - **Acceptance**: `mvn test` passes with 0 failures, 0 errors; total test count increases by 4.

- [ ] 19. Final verification — build and test
  - Run `mvn clean test` in `backend/` and confirm 0 failures, 0 errors, all new tests present in output.
  - Run `npm run build` in `frontend/` and confirm clean TypeScript compilation and Vite build success.
  - Confirm `docker-compose up -d` still starts `postgres` and `redis` containers cleanly (no changes to `docker-compose.yml` needed).
  - **Acceptance**: Green build on both backend and frontend; all existing tests continue to pass alongside the new ones.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 2, 3, 8, 9, 14] },
    { "wave": 2, "tasks": [4, 5, 10, 15] },
    { "wave": 3, "tasks": [6, 11, 16] },
    { "wave": 4, "tasks": [7, 12, 17] },
    { "wave": 5, "tasks": [13, 18] },
    { "wave": 6, "tasks": [19] }
  ],
  "dependencies": {
    "4":  ["3"],
    "5":  ["2"],
    "6":  ["2", "4", "5"],
    "7":  ["6"],
    "10": ["8"],
    "11": ["8", "9", "10"],
    "12": ["1", "8"],
    "15": ["14"],
    "16": ["15"],
    "17": ["9"],
    "18": ["6", "9"],
    "19": ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18"]
  }
}
```

## Notes

- Tasks 1–13 are backend-only. Tasks 14–16 are frontend-only. Task 17–18 are tests. Task 19 is verification.
- No existing files are deleted. No existing endpoints are modified.
- The frontend patch panel (tasks 14–16) adds ~60 lines to `IssueDetailDrawer.tsx` only — no changes to `App.tsx`, `Sidebar.tsx`, `TriageQueueTab.tsx`, or any other component.
- The `StaleIssueScheduler` changes (task 12) are strictly additive — the existing `TriagedIssueRepository` constructor injection is extended, not replaced.
- All new Java classes go into existing packages (`dto`, `client`, `controller`, `service`, `security`) — no new packages are created.
- Mock mode continues to work for all features: patch generation returns a realistic mock diff, webhook triage uses the existing heuristic classifier.
