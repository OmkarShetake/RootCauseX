package com.rootcausex.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.client.GitHubIssueDto;
import com.rootcausex.client.GitHubLabelDto;
import com.rootcausex.dto.RootCauseAnalysis;
import com.rootcausex.dto.TriagedIssueResponse;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.exception.ResourceNotFoundException;
import com.rootcausex.exception.TriageException;
import com.rootcausex.repository.TriagedIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class IssueTriageService {

    private static final Logger log = LoggerFactory.getLogger(IssueTriageService.class);

    private final GitHubClientService gitHubClientService;
    private final TriagedIssueRepository triagedIssueRepository;
    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rootcausex.duplicate-threshold:0.88}")
    private double duplicateThreshold;

    @Value("${rootcausex.cache.triage-ttl-hours:24}")
    private long triageTtlHours;

    public IssueTriageService(
        GitHubClientService gitHubClientService,
        TriagedIssueRepository triagedIssueRepository,
        VectorStore vectorStore,
        ChatClient chatClient,
        RedisTemplate<String, Object> redisTemplate,
        ObjectMapper objectMapper
    ) {
        this.gitHubClientService = gitHubClientService;
        this.triagedIssueRepository = triagedIssueRepository;
        this.vectorStore = vectorStore;
        this.chatClient = chatClient;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Triages all open issues for a repository.
     */
    public List<TriagedIssueResponse> triageRepository(String owner, String repo) {
        String repoFullName = owner + "/" + repo;
        log.info("Starting automated triage for open issues in repository: {}", repoFullName);

        List<GitHubIssueDto> openIssues = gitHubClientService.fetchOpenIssues(owner, repo, 30);
        List<TriagedIssueResponse> responses = new ArrayList<>();

        for (GitHubIssueDto issue : openIssues) {
            try {
                TriagedIssueResponse triaged = triageSingleIssue(owner, repo, issue.number(), issue);
                responses.add(triaged);
            } catch (Exception e) {
                log.error("Failed to triage issue #{} in {}: {}", issue.number(), repoFullName, e.getMessage(), e);
            }
        }

        return responses;
    }

    /**
     * Triages a single issue with caching, pgvector search, and LLM structured analysis.
     */
    public TriagedIssueResponse triageIssue(String owner, String repo, int issueNumber) {
        GitHubIssueDto issue = gitHubClientService.fetchIssueByNumber(owner, repo, issueNumber);
        if (issue == null) {
            throw new ResourceNotFoundException("Issue #" + issueNumber + " could not be retrieved from " + owner + "/" + repo);
        }
        return triageSingleIssue(owner, repo, issueNumber, issue);
    }

    @Transactional
    public TriagedIssueResponse triageSingleIssue(String owner, String repo, int issueNumber, GitHubIssueDto issue) {
        String repoFullName = owner + "/" + repo;
        String cacheKey = "rootcausex:triage:" + owner + ":" + repo + ":" + issueNumber;

        // Step 1: Redis Cache Check
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.info("CACHE HIT: Redis found cached triage response for key: {}", cacheKey);
                if (cached instanceof TriagedIssueResponse response) {
                    return response;
                } else {
                    return objectMapper.convertValue(cached, TriagedIssueResponse.class);
                }
            }
        } catch (Exception e) {
            log.warn("Redis cache read skipped or failed: {}", e.getMessage());
        }

        log.info("CACHE MISS: Executing triage engine for issue #{} ({})", issueNumber, repoFullName);

        // Step 2: Vector Similarity Search
        String queryText = (issue.title() != null ? issue.title() : "") + "\n" + (issue.body() != null ? issue.body() : "");
        List<Document> similarDocs = new ArrayList<>();
        try {
            SearchRequest request = SearchRequest.builder()
                .query(queryText)
                .topK(5)
                .similarityThreshold(0.3)
                .build();
            List<Document> rawDocs = vectorStore.similaritySearch(request);
            if (rawDocs != null) {
                similarDocs = rawDocs.stream()
                    .filter(doc -> repoFullName.equals(doc.getMetadata().get("repoFullName")))
                    .limit(3)
                    .toList();
            }
        } catch (Exception e) {
            log.warn("pgvector similarity search failed: {}", e.getMessage());
        }

        // Check duplicate condition
        boolean isDuplicate = false;
        Integer duplicateIssueNumber = null;
        double bestSimilarityScore = 0.0;

        if (!similarDocs.isEmpty()) {
            Document topDoc = similarDocs.get(0);
            Double score = topDoc.getScore();
            if (score != null) {
                bestSimilarityScore = score;
            } else {
                bestSimilarityScore = 0.75; // default fallback similarity
            }

            Object numObj = topDoc.getMetadata().get("issueNumber");
            if (numObj instanceof Number n) {
                duplicateIssueNumber = n.intValue();
            } else if (numObj != null) {
                try {
                    duplicateIssueNumber = Integer.parseInt(numObj.toString());
                } catch (NumberFormatException ignored) {}
            }

            if (bestSimilarityScore >= duplicateThreshold) {
                isDuplicate = true;
                log.info("DUPLICATE FLAGGED: Issue #{} matches past issue #{} with similarity score {}", 
                    issueNumber, duplicateIssueNumber, bestSimilarityScore);
            }
        }

        // Step 3: Structured Output with Spring AI ChatClient
        RootCauseAnalysis analysis = generateStructuredAnalysis(
            repoFullName,
            issueNumber,
            issue.title(),
            issue.body(),
            similarDocs,
            isDuplicate,
            duplicateIssueNumber,
            bestSimilarityScore
        );

        // Persist to PostgreSQL database (triaged_issues table)
        TriagedIssue entity = triagedIssueRepository
            .findByRepoFullNameAndIssueNumber(repoFullName, issueNumber)
            .orElseGet(() -> TriagedIssue.builder()
                .repoFullName(repoFullName)
                .issueNumber(issueNumber)
                .build());

        entity.setTitle(issue.title() != null ? issue.title() : "Untitled Issue");
        entity.setBody(issue.body());
        entity.setAuthor(issue.user() != null ? issue.user().login() : "unknown");
        entity.setState(issue.state() != null ? issue.state().toUpperCase() : "OPEN");
        entity.setCategory(analysis.category());
        entity.setSeverity(analysis.severity());
        entity.setDuplicate(analysis.isDuplicate());
        entity.setDuplicateIssueNumber(analysis.duplicateIssueNumber());
        entity.setSimilarityScore(analysis.similarityScore());
        entity.setGoodFirstIssue(analysis.isGoodFirstIssue());
        entity.setRootCauseHint(analysis.rootCauseHint());
        entity.setSuggestedReply(analysis.suggestedReply());
        entity.setGithubCreatedAt(issue.createdAt() != null ? issue.createdAt() : Instant.now());
        entity.setTriagedAt(Instant.now());
        entity.setHtmlUrl(issue.htmlUrl());

        List<String> labelNames = issue.labels() != null
            ? issue.labels().stream().map(GitHubLabelDto::name).toList()
            : List.of();
        try {
            entity.setLabels(objectMapper.writeValueAsString(labelNames));
        } catch (JsonProcessingException e) {
            entity.setLabels("[]");
        }

        TriagedIssue saved = triagedIssueRepository.save(entity);

        TriagedIssueResponse response = mapToResponse(saved, labelNames);

        // Cache in Redis with 24 hours TTL
        try {
            redisTemplate.opsForValue().set(cacheKey, response, Duration.ofHours(triageTtlHours));
            log.info("Saved triage response to Redis cache with key: {} (TTL {}h)", cacheKey, triageTtlHours);
        } catch (Exception e) {
            log.warn("Failed to write to Redis cache: {}", e.getMessage());
        }

        return response;
    }

    private RootCauseAnalysis generateStructuredAnalysis(
        String repoFullName,
        int issueNumber,
        String title,
        String body,
        List<Document> similarDocs,
        boolean isDuplicate,
        Integer duplicateIssueNumber,
        double bestSimilarityScore
    ) {
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("New GitHub Issue for repository: ").append(repoFullName).append("\n");
        contextBuilder.append("Issue #").append(issueNumber).append(": ").append(title).append("\n");
        contextBuilder.append("Description:\n").append(body != null ? body : "").append("\n\n");

        if (!similarDocs.isEmpty()) {
            contextBuilder.append("Top Similar Historical Issues from pgvector index:\n");
            for (Document doc : similarDocs) {
                contextBuilder.append("- Issue #").append(doc.getMetadata().get("issueNumber"))
                    .append(" (Title: ").append(doc.getMetadata().get("title"))
                    .append(", Score: ").append(doc.getScore())
                    .append("):\n").append(doc.getText()).append("\n");
            }
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are RootCauseX, an expert Staff Software Engineer and GitHub Triage Specialist.\n");
        prompt.append("Analyze the following GitHub issue and classify it precisely.\n\n");
        prompt.append("Context:\n").append(contextBuilder).append("\n\n");
        prompt.append("Duplicate Detection Rules:\n");
        prompt.append("- Duplicate threshold is ").append(duplicateThreshold).append(".\n");
        prompt.append("- If similarity >= ").append(duplicateThreshold).append(", set isDuplicate to true and reference the past issue number.\n\n");
        prompt.append("Requirements:\n");
        prompt.append("1. category: Choose strictly from [\"BUG\", \"SECURITY\", \"FEATURE\", \"DOCS\"].\n");
        prompt.append("2. severity: Choose strictly from [\"CRITICAL\", \"HIGH\", \"MEDIUM\", \"LOW\"].\n");
        prompt.append("   - CRITICAL: Data loss, CVE/exploit, production outages, deadlock, auth bypass.\n");
        prompt.append("   - HIGH: Core functionality broken with no workaround, severe performance degradation.\n");
        prompt.append("   - MEDIUM: Non-critical bugs, standard features.\n");
        prompt.append("   - LOW: Minor cosmetics, typos, simple docs.\n");
        prompt.append("3. isGoodFirstIssue: true if isolated, beginner-friendly scope with clear guidance.\n");
        prompt.append("4. rootCauseHint: Concise, highly technical diagnosis referencing possible failure points, components, stack traces, or historical fixes.\n");
        prompt.append("5. suggestedReply: Polite, professional Markdown comment to be posted on GitHub by repo maintainers.\n");

        try {
            RootCauseAnalysis result = chatClient.prompt()
                .user(prompt.toString())
                .call()
                .entity(RootCauseAnalysis.class);

            if (result != null) {
                return result;
            }
        } catch (Exception e) {
            log.warn("ChatClient structured entity mapping failed: {}. Falling back to heuristic classifier.", e.getMessage());
        }

        // Heuristic fallback
        return determineHeuristicAnalysis(title, body, isDuplicate, duplicateIssueNumber, bestSimilarityScore);
    }

    private RootCauseAnalysis determineHeuristicAnalysis(
        String title,
        String body,
        boolean isDuplicate,
        Integer duplicateIssueNumber,
        double bestSimilarityScore
    ) {
        String combined = ((title != null ? title : "") + " " + (body != null ? body : "")).toLowerCase();
        String category = "BUG";
        String severity = "MEDIUM";
        boolean isGoodFirst = false;
        String rootCause = "Initial analysis suggests potential state inconsistency or component misconfiguration.";
        String reply = "Thank you for reporting this issue! Our team has flagged this for technical investigation.";

        if (combined.contains("cve") || combined.contains("security") || combined.contains("vulnerability") || combined.contains("exploit") || combined.contains("token") || combined.contains("secret")) {
            category = "SECURITY";
            severity = "CRITICAL";
            rootCause = "High-severity security perimeter alert. Review authentication filters and token/credential masking.";
            reply = "Thank you for this security disclosure. Our security maintainers are reviewing this report immediately.";
        } else if (combined.contains("timeout") || combined.contains("deadlock") || combined.contains("leak") || combined.contains("oom") || combined.contains("connection")) {
            category = "BUG";
            severity = "CRITICAL";
            rootCause = "Resource starvation or database connection pool exhaustion detected. Check connection leak timeouts and transactional boundaries.";
            reply = "We have reproduced the resource contention pattern. Reviewing thread dumps and connection pool configuration.";
        } else if (combined.contains("typo") || combined.contains("readme") || combined.contains("docs") || combined.contains("documentation")) {
            category = "DOCS";
            severity = "LOW";
            isGoodFirst = true;
            rootCause = "Documentation discrepancy in user guides or markdown reference.";
            reply = "Great catch! We would be delighted to accept a pull request resolving this documentation update.";
        } else if (combined.contains("feature") || combined.contains("enhancement") || combined.contains("support for") || combined.contains("add ")) {
            category = "FEATURE";
            severity = "MEDIUM";
            isGoodFirst = combined.contains("simple") || combined.contains("easy");
            rootCause = "Enhancement requires interface extension and backward compatibility test suites.";
            reply = "Thank you for proposing this enhancement! We are evaluating this against our architectural roadmap.";
        }

        return new RootCauseAnalysis(
            category,
            severity,
            isDuplicate,
            duplicateIssueNumber,
            bestSimilarityScore,
            isGoodFirst,
            rootCause,
            reply
        );
    }

    /**
     * Lists triaged issues with filtering support.
     */
    public List<TriagedIssueResponse> listTriagedIssues(
        String owner,
        String repo,
        String category,
        String severity,
        Boolean isDuplicate,
        Boolean isGoodFirstIssue,
        String search
    ) {
        String repoFullName = owner + "/" + repo;

        Specification<TriagedIssue> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("repoFullName"), repoFullName));

            if (category != null && !category.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("category")), category.trim().toUpperCase()));
            }
            if (severity != null && !severity.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("severity")), severity.trim().toUpperCase()));
            }
            if (isDuplicate != null) {
                predicates.add(cb.equal(root.get("duplicate"), isDuplicate));
            }
            if (isGoodFirstIssue != null) {
                predicates.add(cb.equal(root.get("goodFirstIssue"), isGoodFirstIssue));
            }
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("rootCauseHint")), pattern)
                ));
            }

            query.orderBy(cb.desc(root.get("issueNumber")));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return triagedIssueRepository.findAll(spec).stream()
            .map(issue -> mapToResponse(issue, parseLabels(issue.getLabels())))
            .toList();
    }

    private List<String> parseLabels(String labelsJson) {
        if (labelsJson == null || labelsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(labelsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private TriagedIssueResponse mapToResponse(TriagedIssue entity, List<String> labels) {
        return new TriagedIssueResponse(
            entity.getId(),
            entity.getRepoFullName(),
            entity.getIssueNumber(),
            entity.getTitle(),
            entity.getBody(),
            entity.getAuthor(),
            entity.getState(),
            entity.getCategory(),
            entity.getSeverity(),
            entity.isDuplicate(),
            entity.getDuplicateIssueNumber(),
            entity.getSimilarityScore() != null ? entity.getSimilarityScore() : 0.0,
            entity.isGoodFirstIssue(),
            entity.getRootCauseHint(),
            entity.getSuggestedReply(),
            entity.getGithubCreatedAt(),
            entity.getTriagedAt(),
            entity.getHtmlUrl(),
            labels
        );
    }
}
