package com.rootcausex.service;

import com.rootcausex.client.GitHubIssueDto;
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
