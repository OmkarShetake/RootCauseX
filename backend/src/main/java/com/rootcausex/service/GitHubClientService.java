package com.rootcausex.service;

import com.rootcausex.client.GitHubContentsDto;
import com.rootcausex.client.GitHubIssueDto;
import com.rootcausex.client.GitHubSourceFile;
import com.rootcausex.exception.GitHubApiException;
import com.rootcausex.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class GitHubClientService {

    private static final Logger log = LoggerFactory.getLogger(GitHubClientService.class);

    private final RestClient restClient;

    public GitHubClientService(RestClient restClient) {
        this.restClient = restClient;
    }

    /**
     * Fetches closed issues for a repository using genuine GitHub pagination.
     * Strict Zero-Fake Policy: Never returns simulated data on API errors.
     */
    public List<GitHubIssueDto> fetchClosedIssues(String owner, String repo, int limit) {
        log.info("Fetching up to {} closed issues for {}/{}", limit, owner, repo);
        return fetchPaginatedIssues(owner, repo, "closed", "updated", "desc", limit);
    }

    /**
     * Fetches open issues for a repository using genuine GitHub pagination.
     * Strict Zero-Fake Policy: Never returns simulated data on API errors.
     */
    public List<GitHubIssueDto> fetchOpenIssues(String owner, String repo, int limit) {
        log.info("Fetching up to {} open issues for {}/{}", limit, owner, repo);
        return fetchPaginatedIssues(owner, repo, "open", "created", "desc", limit);
    }

    /**
     * Fetches a single issue by number.
     * Strict Zero-Fake Policy: Never returns simulated data.
     */
    public GitHubIssueDto fetchIssueByNumber(String owner, String repo, int issueNumber) {
        log.info("Fetching issue #{} for {}/{}", issueNumber, owner, repo);
        return restClient.get()
            .uri("/repos/{owner}/{repo}/issues/{issueNumber}", owner, repo, issueNumber)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> handleClientError(resp.getStatusCode(), resp.getHeaders(), owner, repo, issueNumber))
            .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                throw new GitHubApiException("GitHub server error: " + resp.getStatusText(), resp.getStatusCode().value());
            })
            .body(GitHubIssueDto.class);
    }

    /**
     * Real paginated issue retrieval fetching up to 'limit' non-PR issues.
     */
    private List<GitHubIssueDto> fetchPaginatedIssues(
        String owner,
        String repo,
        String state,
        String sort,
        String direction,
        int targetLimit
    ) {
        List<GitHubIssueDto> results = new ArrayList<>();
        int page = 1;
        int maxPages = Math.max(1, (int) Math.ceil((double) targetLimit / 100));

        while (results.size() < targetLimit && page <= maxPages) {
            int perPage = Math.min(targetLimit - results.size(), 100);
            int currentPage = page;

            java.util.Map<String, Object> uriVars = java.util.Map.of(
                "owner", owner,
                "repo", repo,
                "state", state,
                "perPage", perPage,
                "page", currentPage,
                "sort", sort,
                "direction", direction
            );

            List<GitHubIssueDto> pageIssues = restClient.get()
                .uri("/repos/{owner}/{repo}/issues?state={state}&per_page={perPage}&page={page}&sort={sort}&direction={direction}", uriVars)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> handleClientError(resp.getStatusCode(), resp.getHeaders(), owner, repo, null))
                .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                    throw new GitHubApiException("GitHub server error: " + resp.getStatusText(), resp.getStatusCode().value());
                })
                .body(new ParameterizedTypeReference<List<GitHubIssueDto>>() {});

            if (pageIssues == null || pageIssues.isEmpty()) {
                break;
            }

            // Exclude pull requests (GitHub issues API includes PRs unless filtered)
            List<GitHubIssueDto> pureIssues = pageIssues.stream()
                .filter(issue -> !issue.isPullRequest())
                .toList();

            results.addAll(pureIssues);

            if (pageIssues.size() < perPage) {
                // Last page reached
                break;
            }
            page++;
        }

        if (results.size() > targetLimit) {
            return results.subList(0, targetLimit);
        }
        return results;
    }

    /**
     * Fetches the most relevant Java source file for a given component keyword.
     * Never throws — returns a sentinel GitHubSourceFile on any failure.
     */
    public GitHubSourceFile fetchBestSourceFile(String owner, String repo, String component) {
        String safeComponent = (component != null && !component.isBlank()) ? component.toLowerCase() : "config";
        try {
            // Try to list src/main/java directory
            List<GitHubContentsDto> entries = null;
            try {
                entries = restClient.get()
                    .uri("/repos/{owner}/{repo}/contents/src/main/java", owner, repo)
                    .retrieve()
                    .onStatus(org.springframework.http.HttpStatusCode::is4xxClientError, (req, resp) -> {})
                    .onStatus(org.springframework.http.HttpStatusCode::is5xxServerError, (req, resp) -> {})
                    .body(new ParameterizedTypeReference<List<GitHubContentsDto>>() {});
            } catch (Exception e) {
                log.debug("Could not list src/main/java for {}/{}: {}", owner, repo, e.getMessage());
            }

            // Fallback: try root contents
            if (entries == null || entries.isEmpty()) {
                try {
                    entries = restClient.get()
                        .uri("/repos/{owner}/{repo}/contents", owner, repo)
                        .retrieve()
                        .onStatus(org.springframework.http.HttpStatusCode::is4xxClientError, (req, resp) -> {})
                        .onStatus(org.springframework.http.HttpStatusCode::is5xxServerError, (req, resp) -> {})
                        .body(new ParameterizedTypeReference<List<GitHubContentsDto>>() {});
                } catch (Exception e) {
                    log.debug("Could not list root contents for {}/{}: {}", owner, repo, e.getMessage());
                }
            }

            if (entries == null || entries.isEmpty()) {
                return new GitHubSourceFile("unknown", "Source file unavailable.");
            }

            // Find first file matching the component keyword
            String matchedPath = null;
            for (GitHubContentsDto entry : entries) {
                if ("file".equals(entry.type()) && entry.path() != null
                    && entry.path().toLowerCase().contains(safeComponent)
                    && entry.path().endsWith(".java")) {
                    matchedPath = entry.path();
                    break;
                }
            }

            // If no match, use first .java file
            if (matchedPath == null) {
                for (GitHubContentsDto entry : entries) {
                    if ("file".equals(entry.type()) && entry.path() != null && entry.path().endsWith(".java")) {
                        matchedPath = entry.path();
                        break;
                    }
                }
            }

            if (matchedPath == null) {
                return new GitHubSourceFile("unknown", "Source file unavailable.");
            }

            // Fetch the file content
            final String finalPath = matchedPath;
            GitHubContentsDto fileDto = restClient.get()
                .uri("/repos/{owner}/{repo}/contents/{path}", owner, repo, finalPath)
                .retrieve()
                .onStatus(org.springframework.http.HttpStatusCode::is4xxClientError, (req, resp) -> {})
                .onStatus(org.springframework.http.HttpStatusCode::is5xxServerError, (req, resp) -> {})
                .body(GitHubContentsDto.class);

            if (fileDto == null || fileDto.content() == null) {
                return new GitHubSourceFile(finalPath, "Source file content unavailable.");
            }

            // Base64-decode (strip newlines from GitHub's chunked encoding)
            String rawContent = fileDto.content().replaceAll("\\n", "");
            byte[] decoded = Base64.getMimeDecoder().decode(rawContent);
            String decodedContent = new String(decoded, java.nio.charset.StandardCharsets.UTF_8);
            return new GitHubSourceFile(finalPath, decodedContent);

        } catch (Exception e) {
            log.warn("fetchBestSourceFile failed for {}/{} (component={}): {}", owner, repo, safeComponent, e.getMessage());
            return new GitHubSourceFile("unknown", "Source file unavailable.");
        }
    }

    private void handleClientError(HttpStatusCode status, HttpHeaders headers, String owner, String repo, Integer issueNumber) {
        int code = status.value();
        String repoIdentifier = owner + "/" + repo + (issueNumber != null ? " #" + issueNumber : "");

        if (code == 404) {
            throw new ResourceNotFoundException("GitHub repository or issue not found: " + repoIdentifier);
        }

        if (code == 403) {
            Long resetEpoch = null;
            String resetHeader = headers.getFirst("X-RateLimit-Reset");
            if (resetHeader != null) {
                try {
                    resetEpoch = Long.parseLong(resetHeader);
                } catch (NumberFormatException ignored) {}
            }
            String remainingHeader = headers.getFirst("X-RateLimit-Remaining");
            String msg = String.format("GitHub API rate limit reached (Remaining: %s, Reset Epoch: %s). Configure GITHUB_TOKEN environment variable for 5,000 req/hr.",
                remainingHeader != null ? remainingHeader : "0",
                resetEpoch != null ? resetEpoch : "unknown");
            throw new GitHubApiException(msg, 403, resetEpoch);
        }

        throw new GitHubApiException("GitHub API client error [" + code + "] on " + repoIdentifier, code);
    }
}
