package com.rootcausex.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubLabelDto(
    Long id,
    String name,
    String color,
    String description
) {}
