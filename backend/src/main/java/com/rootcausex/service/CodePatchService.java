package com.rootcausex.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.client.GitHubSourceFile;
import com.rootcausex.dto.CodePatchResponse;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.repository.TriagedIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class CodePatchService {

    private static final Logger log = LoggerFactory.getLogger(CodePatchService.class);

    private static final CodePatchResponse FALLBACK = new CodePatchResponse(
        "unknown",
        "Patch generation requires a live AI API key and an accessible source file. " +
        "Set AI_API_KEY in your environment and ensure the repository is public or GITHUB_TOKEN is configured.",
        "",
        "",
        ""
    );

    private final TriagedIssueRepository triagedIssueRepository;
    private final IssueTriageService issueTriageService;
    private final GitHubClientService gitHubClientService;
    private final ChatClient chatClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rootcausex.cache.triage-ttl-hours:24}")
    private long cacheTtlHours;

    public CodePatchService(
        TriagedIssueRepository triagedIssueRepository,
        IssueTriageService issueTriageService,
        GitHubClientService gitHubClientService,
        ChatClient chatClient,
        RedisTemplate<String, Object> redisTemplate,
        ObjectMapper objectMapper
    ) {
        this.triagedIssueRepository = triagedIssueRepository;
        this.issueTriageService = issueTriageService;
        this.gitHubClientService = gitHubClientService;
        this.chatClient = chatClient;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public CodePatchResponse generatePatch(String owner, String repo, int issueNumber) {
        String repoFullName = owner + "/" + repo;
        String cacheKey = "rootcausex:patch:" + owner + ":" + repo + ":" + issueNumber;

        // Step 1: Redis cache check
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.info("CACHE HIT: Redis found cached patch for key: {}", cacheKey);
                if (cached instanceof CodePatchResponse response) {
                    return response;
                }
                return objectMapper.convertValue(cached, CodePatchResponse.class);
            }
        } catch (Exception e) {
            log.warn("Redis patch cache read failed: {}", e.getMessage());
        }

        log.info("CACHE MISS: Generating code patch for {}/#{}", repoFullName, issueNumber);

        // Step 2: Load triage record (or triage now if not yet done)
        TriagedIssue triaged = triagedIssueRepository
            .findByRepoFullNameAndIssueNumber(repoFullName, issueNumber)
            .orElse(null);

        if (triaged == null) {
            try {
                issueTriageService.triageIssue(owner, repo, issueNumber);
                triaged = triagedIssueRepository
                    .findByRepoFullNameAndIssueNumber(repoFullName, issueNumber)
                    .orElse(null);
            } catch (Exception e) {
                log.warn("Could not auto-triage issue #{} before patch generation: {}", issueNumber, e.getMessage());
            }
        }

        String component = triaged != null && triaged.getComponent() != null ? triaged.getComponent() : "core";
        String title = triaged != null ? triaged.getTitle() : "Issue #" + issueNumber;
        String rootCauseHint = triaged != null ? triaged.getRootCauseHint() : "Unknown root cause.";

        // Step 3: Fetch relevant source file
        GitHubSourceFile sourceFile = gitHubClientService.fetchBestSourceFile(owner, repo, component);

        // Step 4: Build AI prompt
        String truncatedContent = sourceFile.content().length() > 3000
            ? sourceFile.content().substring(0, 3000) + "\n// ... (truncated)"
            : sourceFile.content();

        String prompt = "You are RootCauseX, an expert Java engineer generating a minimal targeted code patch.\n\n" +
            "Repository: " + repoFullName + "\n" +
            "Issue #" + issueNumber + ": " + title + "\n" +
            "Root Cause: " + rootCauseHint + "\n" +
            "Component: " + component + "\n\n" +
            "Source file (" + sourceFile.path() + "):\n```java\n" + truncatedContent + "\n```\n\n" +
            "Task: Generate a precise code patch that fixes this issue.\n" +
            "Return a JSON object with these exact fields:\n" +
            "- targetFile: the file path\n" +
            "- explanation: a concise explanation of what was changed and why\n" +
            "- originalSnippet: the exact lines before the patch (3-10 lines)\n" +
            "- patchedSnippet: the exact lines after the patch (3-10 lines)\n" +
            "- gitDiff: a valid unified diff showing the change\n";

        // Step 5: Call AI
        CodePatchResponse result = null;
        try {
            result = chatClient.prompt()
                .user(prompt)
                .call()
                .entity(CodePatchResponse.class);
        } catch (Exception e) {
            log.warn("ChatClient patch generation failed for #{}: {}. Returning fallback.", issueNumber, e.getMessage());
        }

        if (result == null || (result.targetFile() == null && result.gitDiff() == null)) {
            log.warn("AI returned empty patch for {}/#{}, serving fallback.", repoFullName, issueNumber);
            return FALLBACK;
        }

        // Step 6: Cache result
        try {
            redisTemplate.opsForValue().set(cacheKey, result, Duration.ofHours(cacheTtlHours));
            log.info("Cached code patch for key: {} (TTL {}h)", cacheKey, cacheTtlHours);
        } catch (Exception e) {
            log.warn("Failed to cache patch result: {}", e.getMessage());
        }

        return result;
    }
}
