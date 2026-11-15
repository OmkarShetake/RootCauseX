package com.rootcausex.dto;

public record KnowledgeSyncResponse(
    String owner,
    String repo,
    String repoFullName,
    int syncedCount,
    String status,
    String message
) {}
