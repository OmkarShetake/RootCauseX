package com.rootcausex.dto;

import java.time.Instant;

public record StaleIssueAlert(
    String repoFullName,
    int issueNumber,
    String title,
    String severity,
    String category,
    long daysOpen,
    Instant githubCreatedAt,
    String htmlUrl
) {}
