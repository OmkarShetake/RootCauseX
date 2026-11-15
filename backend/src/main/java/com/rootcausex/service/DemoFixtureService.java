package com.rootcausex.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.client.GitHubIssueDto;
import com.rootcausex.client.GitHubLabelDto;
import com.rootcausex.client.GitHubUserDto;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.repository.TriagedIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service specifically for explicit offline presentations and demo fixtures.
 * Separated strictly from production GitHub API synchronization.
 */
@Service
public class DemoFixtureService {

    private static final Logger log = LoggerFactory.getLogger(DemoFixtureService.class);

    private final TriagedIssueRepository triagedIssueRepository;
    private final VectorStore vectorStore;
    private final ObjectMapper objectMapper;

    public DemoFixtureService(
        TriagedIssueRepository triagedIssueRepository,
        VectorStore vectorStore,
        ObjectMapper objectMapper
    ) {
        this.triagedIssueRepository = triagedIssueRepository;
        this.vectorStore = vectorStore;
        this.objectMapper = objectMapper;
    }

    public List<GitHubIssueDto> getSampleHistoricalIssues(String owner, String repo) {
        String repoFullName = owner + "/" + repo;
        List<GitHubIssueDto> fallbacks = new ArrayList<>();
        fallbacks.add(new GitHubIssueDto(
            101L, 101,
            "HikariCP connection leak during PetClinic visit batch persistence",
            "Root Cause Resolved: EntityManager session was not being closed on repository rollback, causing connection starvation in HikariCP pool. Resolved by annotating @Transactional(propagation = Propagation.REQUIRED) and setting leakDetectionThreshold=2000ms.",
            "closed",
            "https://github.com/" + repoFullName + "/issues/101",
            new GitHubUserDto("spring-dev", 10L, "", ""),
            List.of(new GitHubLabelDto(1L, "bug", "d73a4a", "bug"), new GitHubLabelDto(2L, "database", "0075ca", "")),
            Instant.now().minus(30, ChronoUnit.DAYS),
            Instant.now().minus(25, ChronoUnit.DAYS),
            Instant.now().minus(25, ChronoUnit.DAYS),
            null
        ));
        fallbacks.add(new GitHubIssueDto(
            102L, 102,
            "CVE-2024-X: Actuator endpoint exposure without Spring Security filter",
            "Resolved: /actuator/env and /actuator/heapdump were accessible without authentication. Secured via SecurityFilterChain with authorizeHttpRequests().requestMatchers(EndpointRequest.toAnyEndpoint()).hasRole('ADMIN').",
            "closed",
            "https://github.com/" + repoFullName + "/issues/102",
            new GitHubUserDto("sec-analyst", 11L, "", ""),
            List.of(new GitHubLabelDto(3L, "security", "b60205", "security")),
            Instant.now().minus(45, ChronoUnit.DAYS),
            Instant.now().minus(40, ChronoUnit.DAYS),
            Instant.now().minus(40, ChronoUnit.DAYS),
            null
        ));
        fallbacks.add(new GitHubIssueDto(
            103L, 103,
            "Fix typo in Docker compose README setup instructions",
            "Resolved: Corrected postgres container healthcheck port from 5433 to 5432 in docs/docker.md.",
            "closed",
            "https://github.com/" + repoFullName + "/issues/103",
            new GitHubUserDto("first-timer", 12L, "", ""),
            List.of(new GitHubLabelDto(4L, "documentation", "0075ca", "documentation"), new GitHubLabelDto(5L, "good first issue", "7057ff", "")),
            Instant.now().minus(20, ChronoUnit.DAYS),
            Instant.now().minus(19, ChronoUnit.DAYS),
            Instant.now().minus(19, ChronoUnit.DAYS),
            null
        ));
        fallbacks.add(new GitHubIssueDto(
            104L, 104,
            "NullPointerException when Owner telephone field contains international characters",
            "Resolved: Added regex pattern validation @Pattern(regexp = \"^[0-9+\\\\s-]{7,15}$\") on Owner.telephone and handled null check in OwnerFormatter.",
            "closed",
            "https://github.com/" + repoFullName + "/issues/104",
            new GitHubUserDto("qa-engineer", 13L, "", ""),
            List.of(new GitHubLabelDto(6L, "bug", "d73a4a", "bug")),
            Instant.now().minus(15, ChronoUnit.DAYS),
            Instant.now().minus(12, ChronoUnit.DAYS),
            Instant.now().minus(12, ChronoUnit.DAYS),
            null
        ));
        return fallbacks;
    }

    @Transactional
    public Map<String, Object> loadDemoFixtures(String owner, String repo) {
        String repoFullName = (owner != null ? owner.trim() : "spring-projects") + "/" + 
                              (repo != null ? repo.trim() : "spring-petclinic");
        log.info("Loading offline demo fixtures for repository {}", repoFullName);

        // 1. Index historical closed issues into vector store
        List<GitHubIssueDto> historical = getSampleHistoricalIssues(owner, repo);
        List<Document> documents = new ArrayList<>();
        for (GitHubIssueDto issue : historical) {
            String content = String.format(
                "Repository: %s\nIssue #%d: %s\nState: %s\nResolution Details & Discussion:\n%s",
                repoFullName, issue.number(), issue.title(), issue.state(), issue.body()
            );
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("repoFullName", repoFullName);
            metadata.put("issueNumber", issue.number());
            metadata.put("title", issue.title());
            metadata.put("url", issue.htmlUrl());
            metadata.put("state", issue.state());
            if (issue.closedAt() != null) {
                metadata.put("closedAt", issue.closedAt().toString());
            }
            documents.add(new Document(content, metadata));
        }

        try {
            vectorStore.add(documents);
            log.info("Indexed {} demo historical documents into vector store", documents.size());
        } catch (Exception e) {
            log.warn("Vector store demo indexing notice: {}", e.getMessage());
        }

        // 2. Persist 4 realistic triaged issues
        List<TriagedIssue> demoIssues = List.of(
            TriagedIssue.builder()
                .repoFullName(repoFullName)
                .issueNumber(201)
                .title("Database connection timeout on heavy load in PetClinic visits")
                .body("Under load testing with 50 concurrent users, requests fail with org.springframework.dao.DataAccessResourceFailureException: Unable to acquire JDBC Connection from HikariPool.")
                .author("tester-alice")
                .state("OPEN")
                .category("BUG")
                .severity("CRITICAL")
                .component("database")
                .confidenceScore(0.94)
                .evidenceSource("HISTORICAL_MATCH")
                .duplicate(true)
                .duplicateIssueNumber(101)
                .similarityScore(0.92)
                .similarityExplanation("Matches historical issue #101 error signature: HikariCP pool exhaustion caused by unclosed EntityManager sessions during batch operations.")
                .goodFirstIssue(false)
                .rootCauseHint("Identified connection pool exhaustion in HikariCP. Matches verified fix from historical issue #101: ensure transactional boundaries and leakDetectionThreshold are properly configured.")
                .suggestedReply("Thank you @tester-alice. This matches resolved issue #101 where EntityManager sessions were starving the HikariCP pool. Applying the transactional propagation fix.")
                .githubCreatedAt(Instant.now().minus(9, ChronoUnit.DAYS))
                .triagedAt(Instant.now())
                .htmlUrl("https://github.com/" + repoFullName + "/issues/201")
                .labels("[\"bug\",\"database\"]")
                .build(),

            TriagedIssue.builder()
                .repoFullName(repoFullName)
                .issueNumber(202)
                .title("Security vulnerability: Actuator env endpoint leaks database credentials")
                .body("Running curl against /actuator/env returns cleartext spring.datasource.password. This exposes production secrets.")
                .author("whitehat-bob")
                .state("OPEN")
                .category("SECURITY")
                .severity("CRITICAL")
                .component("security")
                .confidenceScore(0.96)
                .evidenceSource("HISTORICAL_MATCH")
                .duplicate(true)
                .duplicateIssueNumber(102)
                .similarityScore(0.89)
                .similarityExplanation("Identical security perimeter exposure pattern to issue #102: actuator endpoints exposed without Spring Security role authorization.")
                .goodFirstIssue(false)
                .rootCauseHint("Actuator environment endpoints exposed publicly without Role-Based Access Control. Historical fix #102 restricted endpoints via SecurityFilterChain authorizeHttpRequests.")
                .suggestedReply("Thank you @whitehat-bob. We are locking down actuator endpoints with EndpointRequest.toAnyEndpoint().hasRole('ADMIN') as implemented in #102.")
                .githubCreatedAt(Instant.now().minus(8, ChronoUnit.DAYS))
                .triagedAt(Instant.now())
                .htmlUrl("https://github.com/" + repoFullName + "/issues/202")
                .labels("[\"security\"]")
                .build(),

            TriagedIssue.builder()
                .repoFullName(repoFullName)
                .issueNumber(203)
                .title("Typo in Quickstart guide installation commands")
                .body("In README.md line 42, `mvn spring-boot:runn` has a double 'n'. Should be `mvn spring-boot:run`.")
                .author("newbie-coder")
                .state("OPEN")
                .category("DOCS")
                .severity("LOW")
                .component("docs")
                .confidenceScore(0.99)
                .evidenceSource("STACK_TRACE_ANALYSIS")
                .duplicate(false)
                .duplicateIssueNumber(null)
                .similarityScore(0.12)
                .similarityExplanation("Isolated documentation typo; no historical duplicate found.")
                .goodFirstIssue(true)
                .rootCauseHint("Typographical error in README markdown command.")
                .suggestedReply("Great catch @newbie-coder! We would welcome a pull request fixing this typo.")
                .githubCreatedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .triagedAt(Instant.now())
                .htmlUrl("https://github.com/" + repoFullName + "/issues/203")
                .labels("[\"documentation\",\"good first issue\"]")
                .build(),

            TriagedIssue.builder()
                .repoFullName(repoFullName)
                .issueNumber(204)
                .title("Support PostgreSQL JSONB type for Pet medical records metadata")
                .body("We would like to store dynamic attributes for pets in a JSONB column to avoid rigid entity schema migrations.")
                .author("architect-dan")
                .state("OPEN")
                .category("FEATURE")
                .severity("MEDIUM")
                .component("database")
                .confidenceScore(0.82)
                .evidenceSource("HEURISTIC")
                .duplicate(false)
                .duplicateIssueNumber(null)
                .similarityScore(0.25)
                .similarityExplanation("New schema enhancement proposal; no previous duplicates.")
                .goodFirstIssue(false)
                .rootCauseHint("Architectural request requiring Hypersistence Utils or Hibernate 6 native JSON type integration.")
                .suggestedReply("Thank you @architect-dan. We are evaluating JSONB mapping for the next minor release.")
                .githubCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS))
                .triagedAt(Instant.now())
                .htmlUrl("https://github.com/" + repoFullName + "/issues/204")
                .labels("[\"enhancement\"]")
                .build()
        );

        for (TriagedIssue issue : demoIssues) {
            triagedIssueRepository.findByRepoFullNameAndIssueNumber(repoFullName, issue.getIssueNumber())
                .ifPresentOrElse(
                    existing -> {
                        existing.setTitle(issue.getTitle());
                        existing.setBody(issue.getBody());
                        existing.setCategory(issue.getCategory());
                        existing.setSeverity(issue.getSeverity());
                        existing.setComponent(issue.getComponent());
                        existing.setConfidenceScore(issue.getConfidenceScore());
                        existing.setEvidenceSource(issue.getEvidenceSource());
                        existing.setDuplicate(issue.isDuplicate());
                        existing.setDuplicateIssueNumber(issue.getDuplicateIssueNumber());
                        existing.setSimilarityScore(issue.getSimilarityScore());
                        existing.setSimilarityExplanation(issue.getSimilarityExplanation());
                        existing.setGoodFirstIssue(issue.isGoodFirstIssue());
                        existing.setRootCauseHint(issue.getRootCauseHint());
                        existing.setSuggestedReply(issue.getSuggestedReply());
                        triagedIssueRepository.save(existing);
                    },
                    () -> triagedIssueRepository.save(issue)
                );
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", "SUCCESS");
        result.put("repository", repoFullName);
        result.put("historicalIndexed", historical.size());
        result.put("triagedIssuesLoaded", demoIssues.size());
        result.put("message", "Loaded " + demoIssues.size() + " demo fixtures and indexed " + historical.size() + " historical issues for " + repoFullName);
        return result;
    }
}
