# Design Document

## Overview

This design covers the four missing features that must be added to the existing RootCauseX Spring Boot 3.4 + React 19 codebase: a Code Patch Generator, a GitHub Webhook receiver, outbound alert dispatching from the stale issue scheduler, and a minimal frontend patch panel inside the existing `IssueDetailDrawer`.

All additions follow the existing architectural conventions exactly: `Controller → Service → Repository/AI/Redis`, no new packages, no changes to existing endpoints or the frontend layout.

## Architecture

The existing layered architecture is extended with new components in existing packages:

```
frontend/src/
  components/IssueDetailDrawer.tsx   ← patch button + result section added
  services/api.ts                    ← generatePatch() method added
  types/index.ts                     ← CodePatchResponse interface added

backend/src/main/java/com/rootcausex/
  client/
    GitHubContentsDto.java           ← NEW: maps GitHub contents API response
    GitHubSourceFile.java            ← NEW: (path, content) record
  controller/
    PatchController.java             ← NEW: POST /generate-patch
    WebhookController.java           ← NEW: POST /webhooks/github
  security/
    GitHubWebhookSignatureVerifier.java  ← NEW: HMAC-SHA256 verifier
  service/
    CodePatchService.java            ← NEW: patch generation logic
    GitHubClientService.java         ← EXTENDED: fetchBestSourceFile()
    IssueTriageService.java          ← EXTENDED: triageIssueAsync()
    StaleIssueScheduler.java         ← EXTENDED: webhook + email dispatch
  dto/
    CodePatchResponse.java           ← NEW: AI structured output record
  RootCauseXApplication.java         ← EXTENDED: @EnableAsync
  application.yml                    ← EXTENDED: webhook/mail config blocks
  pom.xml                            ← EXTENDED: spring-boot-starter-mail
```

## Components and Interfaces

### `CodePatchResponse` (dto)
```java
public record CodePatchResponse(
    String targetFile,
    String explanation,
    String originalSnippet,
    String patchedSnippet,
    String gitDiff
) {}
```

### `GitHubContentsDto` (client)
```java
// @JsonProperty("download_url") maps downloadUrl
public record GitHubContentsDto(
    String name, String path, String type,
    String content, String encoding, String downloadUrl
) {}
```

### `GitHubSourceFile` (client)
```java
public record GitHubSourceFile(String path, String content) {}
```

### `GitHubClientService` additions
```java
// Returns GitHubSourceFile("unknown","Source file unavailable.") on any failure — never throws
public GitHubSourceFile fetchBestSourceFile(String owner, String repo, String component)
```
Steps:
1. `GET /repos/{owner}/{repo}/contents/src/main/java` → `List<GitHubContentsDto>`
2. Find first entry whose path contains `component` (case-insensitive)
3. If not found, try root contents
4. `GET /repos/{owner}/{repo}/contents/{path}` → `GitHubContentsDto`
5. Base64-decode `content` field (strip `\n` before decoding, use `java.util.Base64.getMimeDecoder()`)
6. Return `GitHubSourceFile(path, decodedContent)`

### `CodePatchService`
Constructor-injected: `TriagedIssueRepository`, `IssueTriageService`, `GitHubClientService`, `ChatClient`, `RedisTemplate<String, Object>`, `ObjectMapper`.

```
generatePatch(owner, repo, issueNumber):
  key = "rootcausex:patch:{owner}:{repo}:{issueNumber}"
  if Redis.get(key) != null → return cached
  issue = repository.findByRepoFullNameAndIssueNumber(repo, num)
            .orElseGet(() -> triageService.triageIssue(owner, repo, num))
  sourceFile = gitHubClient.fetchBestSourceFile(owner, repo, issue.component)
  prompt = build patch prompt with issue fields + sourceFile.content
  result = chatClient.prompt().user(prompt).call().entity(CodePatchResponse.class)
  if result null → return graceful fallback CodePatchResponse
  Redis.set(key, result, 24h TTL)
  return result
```

### `PatchController`
```java
@RestController
@RequestMapping("/api/v1/repos")
// POST /{owner}/{repo}/issues/{issueNumber}/generate-patch
// → CodePatchService.generatePatch() → ResponseEntity.ok()
```

### `GitHubWebhookSignatureVerifier`
```java
@Component
public class GitHubWebhookSignatureVerifier {
    public boolean verify(String secret, byte[] body, String signatureHeader) {
        // 1. Return false if secret or signatureHeader is null/blank
        // 2. Mac mac = Mac.getInstance("HmacSHA256")
        // 3. mac.init(new SecretKeySpec(secret.getBytes(UTF_8), "HmacSHA256"))
        // 4. byte[] computed = mac.doFinal(body)
        // 5. hexEncode(computed) with prefix "sha256="
        // 6. MessageDigest.isEqual(computed_str.getBytes(), signatureHeader.getBytes())
    }
}
```

### `WebhookController`
```java
@RestController
@RequestMapping("/api/v1/webhooks")
// POST /github
// @RequestBody byte[] rawBody (preserves raw bytes for HMAC)
// Logic:
//   if secret blank → 501 ProblemDetail
//   if !verifier.verify(secret, rawBody, signature) → 401 ProblemDetail
//   if eventType != "issues" → 200 {"status":"ignored"}
//   parse payload JSON → action, owner, repo, issueNumber
//   if action not in [opened, reopened] → 200 ignored
//   issueTriageService.triageIssueAsync(owner, repo, issueNumber)
//   return 202 {"status":"accepted"}
```

### `IssueTriageService` addition
```java
@Async
public void triageIssueAsync(String owner, String repo, int issueNumber) {
    try {
        triageIssue(owner, repo, issueNumber);
        log.info("Async webhook triage completed for #{}", issueNumber);
    } catch (Exception e) {
        log.error("Async webhook triage failed for #{}: {}", issueNumber, e.getMessage());
    }
}
```

### `StaleIssueScheduler` changes
- Add `@Autowired(required=false) JavaMailSender mailSender`
- Add `RestClient restClient` via constructor
- After computing `StaleCheckResponse`, if alerts exist:
  - Webhook: `restClient.post().uri(alertWebhookUrl).body(Map.of("text", summary)).retrieve().toBodilessEntity()`
  - Email: `SimpleMailMessage msg = new SimpleMailMessage(); msg.setTo(recipientEmail); msg.setSubject("[RootCauseX] SLA Escalation"); mailSender.send(msg)`
  - Both wrapped in try/catch — failures are logged only

### Mock AI extension (`AiConfig.IntelligentMockChatModel`)
Add detection before existing category logic:
```java
if (lower.contains("targetfile") || lower.contains("gitdiff") || lower.contains("generate a code patch")) {
    // produce CodePatchResponse JSON
    CodePatchResponse mockPatch = new CodePatchResponse(
        "src/main/java/com/example/DatabaseConfig.java",
        "Mock patch: Add connection leak detection threshold to HikariCP configuration.",
        "    config.setConnectionTimeout(30000);",
        "    config.setConnectionTimeout(30000);\n    config.setLeakDetectionThreshold(2000);",
        "--- a/src/main/java/com/example/DatabaseConfig.java\n+++ b/src/main/java/com/example/DatabaseConfig.java\n@@ -15,6 +15,7 @@\n     config.setConnectionTimeout(30000);\n+    config.setLeakDetectionThreshold(2000);\n     return new HikariDataSource(config);"
    );
    return new ChatResponse(List.of(new Generation(new AssistantMessage(objectMapper.writeValueAsString(mockPatch)))));
}
```

## Data Models

### `CodePatchResponse` — new DTO record
No persistence. Cached in Redis only.

### No new database tables required.
The `TriagedIssue` entity and `vector_store` table are unchanged.

### Redis keys used by new features
| Key pattern | TTL | Contents |
|---|---|---|
| `rootcausex:patch:{owner}:{repo}:{issueNumber}` | 24h | `CodePatchResponse` JSON |

## Correctness Properties

### Property 1: HMAC Constant-Time Comparison
Webhook signature verification uses `MessageDigest.isEqual()`, never `String.equals()`, preventing timing attacks that could allow secret brute-forcing.
**Validates: Requirements 12, 13**

### Property 2: Source File Fetch Never Throws
`fetchBestSourceFile` wraps every network call in try/catch and returns the sentinel `GitHubSourceFile("unknown","Source file unavailable.")` on any failure, preserving HTTP 200 for the patch endpoint regardless of GitHub API state.
**Validates: Requirements 6, 7**

### Property 3: Patch Generation Idempotency
The same `{owner}/{repo}/{issueNumber}` triple returns the same `CodePatchResponse` within the 24h Redis TTL window — repeated calls are served from cache without re-invoking AI or GitHub APIs.
**Validates: Requirements 2, 8**

### Property 4: Webhook Replay Safety
Duplicate GitHub webhook deliveries for the same issue within the triage Redis TTL window return the cached triage result immediately without re-executing the AI pipeline.
**Validates: Requirements 15, 16**

### Property 5: Alert Dispatch Fault Isolation
Mail send failures and Slack/Discord webhook POST failures are caught and logged at ERROR level. They never abort `checkStaleIssues()` or prevent `StaleCheckResponse` from being returned to the caller.
**Validates: Requirements 17, 18, 19**

## Error Handling

| Scenario | Behaviour |
|---|---|
| `GITHUB_WEBHOOK_SECRET` not set | HTTP 501 ProblemDetail |
| Invalid webhook signature | HTTP 401 ProblemDetail |
| Source file not found on GitHub | Graceful `CodePatchResponse` with explanation, HTTP 200 |
| AI returns null for patch | Graceful fallback `CodePatchResponse`, HTTP 200 |
| Redis unavailable during patch cache write | Log warning, return result without caching |
| Mail send fails | Log error, do not throw, scheduler continues |
| Webhook alert POST fails | Log error, do not throw, scheduler continues |

## Testing Strategy

All tests are pure unit tests with `@ExtendWith(MockitoExtension.class)` — no Spring context, no embedded database, consistent with the existing test suite pattern.

| Test class | Method | What it verifies |
|---|---|---|
| `GitHubWebhookSignatureVerifierTest` | `verifyValidSignature_returnsTrue` | Real HMAC computation passes |
| `GitHubWebhookSignatureVerifierTest` | `verifyTamperedBody_returnsFalse` | Modified body fails constant-time check |
| `GitHubWebhookSignatureVerifierTest` | `verifyMissingHeader_returnsFalse` | Null header returns false without exception |
| `IssueTriageServiceTest` | `shouldClassifySecurityIssueAsCritical` | CVE title → SECURITY/CRITICAL |
| `IssueTriageServiceTest` | `shouldAssignLowConfidenceForSparseDescription` | Short body → confidenceScore < 0.5 |
| `CodePatchServiceTest` | `shouldReturnCachedPatchOnRedisHit` | Cache hit bypasses AI and GitHub |
| `CodePatchServiceTest` | `shouldCallAiAndCacheOnCacheMiss` | Cache miss triggers AI, result stored in Redis |
