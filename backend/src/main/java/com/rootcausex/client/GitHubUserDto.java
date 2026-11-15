package com.rootcausex.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubUserDto(
    String login,
    Long id,
    @JsonProperty("avatar_url") String avatarUrl,
    @JsonProperty("html_url") String htmlUrl
) {}
