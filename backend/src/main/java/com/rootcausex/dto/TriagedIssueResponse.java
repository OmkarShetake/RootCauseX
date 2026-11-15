package com.rootcausex.dto;

import java.time.Instant;
import java.util.List;

public record TriagedIssueResponse(
    Long id,
    String repoFullName,
    int issueNumber,
    String title,
    String body,
    String author,
    String state,
    String category,
    String severity,
    String component,
    Double confidenceScore,
    String evidenceSource,
    boolean isDuplicate,
    Integer duplicateIssueNumber,
    double similarityScore,
    String similarityExplanation,
    boolean isGoodFirstIssue,
    String rootCauseHint,
    String suggestedReply,
    Instant githubCreatedAt,
    Instant triagedAt,
    String htmlUrl,
    List<String> labels
) {}
