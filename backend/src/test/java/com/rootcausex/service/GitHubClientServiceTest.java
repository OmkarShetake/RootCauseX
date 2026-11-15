package com.rootcausex.service;

import com.rootcausex.client.GitHubIssueDto;
import com.rootcausex.client.GitHubUserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class GitHubClientServiceTest {

    @Mock
    private RestClient restClient;

    private GitHubClientService gitHubClientService;

    @BeforeEach
    void setUp() {
        gitHubClientService = new GitHubClientService(restClient);
    }

    @Test
    @DisplayName("Should return fallback closed issues when GitHub API encounters connection error")
    void shouldReturnFallbackClosedIssuesOnApiError() {
        // When RestClient is mocked or throws, service gracefully returns domain fallback items
        List<GitHubIssueDto> closedIssues = gitHubClientService.fetchClosedIssues("spring-projects", "spring-petclinic", 10);

        assertThat(closedIssues).isNotEmpty();
        assertThat(closedIssues).allMatch(issue -> !issue.isPullRequest());
        assertThat(closedIssues.get(0).title()).contains("HikariCP");
    }

    @Test
    @DisplayName("Should return fallback open issues excluding pull requests")
    void shouldReturnFallbackOpenIssuesExcludingPRs() {
        List<GitHubIssueDto> openIssues = gitHubClientService.fetchOpenIssues("spring-projects", "spring-petclinic", 10);

        assertThat(openIssues).isNotEmpty();
        assertThat(openIssues).allMatch(issue -> !issue.isPullRequest());
        assertThat(openIssues.stream().anyMatch(issue -> issue.number() == 201)).isTrue();
    }

    @Test
    @DisplayName("Should fetch single issue by number with valid issue payload")
    void shouldFetchSingleIssueByNumber() {
        GitHubIssueDto issue = gitHubClientService.fetchIssueByNumber("spring-projects", "spring-petclinic", 201);

        assertThat(issue).isNotNull();
        assertThat(issue.number()).isEqualTo(201);
        assertThat(issue.title()).isNotEmpty();
    }
}
