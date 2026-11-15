package com.rootcausex.service;

import com.rootcausex.client.GitHubIssueDto;
import com.rootcausex.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class GitHubClientServiceTest {

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private GitHubClientService gitHubClientService;

    @BeforeEach
    void setUp() {
        gitHubClientService = new GitHubClientService(restClient);
    }

    @Test
    @DisplayName("Should fetch and filter out pull requests during pagination")
    void shouldFetchAndFilterPullRequests() {
        GitHubIssueDto regularIssue = new GitHubIssueDto(
            1L, 1, "Real Bug", "Bug details", "open", "url", null, List.of(), null, null, null, null
        );
        GitHubIssueDto prIssue = new GitHubIssueDto(
            2L, 2, "PR Feature", "PR details", "open", "url", null, List.of(), null, null, null, Map.of("url", "https://github.com/pull/2")
        );

        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Map.class))).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(List.of(regularIssue, prIssue));

        List<GitHubIssueDto> issues = gitHubClientService.fetchOpenIssues("spring-projects", "spring-petclinic", 10);

        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).number()).isEqualTo(1);
        assertThat(issues.get(0).isPullRequest()).isFalse();
    }

    @Test
    @DisplayName("Strict Zero-Fake Policy: Should throw exception on client error instead of returning fake issues")
    void shouldPropagateExceptionOnApiFailure() {
        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString(), any(Map.class))).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        when(responseSpec.body(any(ParameterizedTypeReference.class)))
            .thenThrow(new ResourceNotFoundException("GitHub repository not found: invalid/repo"));

        assertThatThrownBy(() -> gitHubClientService.fetchClosedIssues("invalid", "repo", 10))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("not found");
    }
}
