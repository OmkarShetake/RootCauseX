package com.rootcausex.dto;

import jakarta.validation.constraints.NotBlank;

public record KnowledgeSyncRequest(
    @NotBlank(message = "GitHub repository owner is required")
    String owner,

    @NotBlank(message = "GitHub repository name is required")
    String repo
) {}
