package com.rootcausex.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubContentsDto(
    String name,
    String path,
    String type,
    String content,
    String encoding,
    @JsonProperty("download_url") String downloadUrl
) {}
