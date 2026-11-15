package com.rootcausex.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubIssueDto(
    Long id,
    int number,
    String title,
    String body,
    String state,
    @JsonProperty("html_url") String htmlUrl,
    GitHubUserDto user,
    List<GitHubLabelDto> labels,
    @JsonProperty("created_at") Instant createdAt,
    @JsonProperty("updated_at") Instant updatedAt,
    @JsonProperty("closed_at") Instant closedAt,
    @JsonProperty("pull_request") Map<String, Object> pullRequest
) {
    public boolean isPullRequest() {
        return pullRequest != null && !pullRequest.isEmpty();
    }
}
