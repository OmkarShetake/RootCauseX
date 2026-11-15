package com.rootcausex.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record RootCauseAnalysis(
    @JsonPropertyDescription("Issue category: BUG, SECURITY, FEATURE, or DOCS")
    String category,

    @JsonPropertyDescription("Issue severity: CRITICAL, HIGH, MEDIUM, or LOW")
    String severity,

    @JsonPropertyDescription("Whether this issue is a duplicate of a previously resolved issue")
    boolean isDuplicate,

    @JsonPropertyDescription("Issue number of the duplicate past issue, or null if not duplicate")
    Integer duplicateIssueNumber,

    @JsonPropertyDescription("Similarity score from 0.0 to 1.0 comparing to the closest historical issue")
    double similarityScore,

    @JsonPropertyDescription("True if isolated, well-defined scope suitable for new open-source contributors")
    boolean isGoodFirstIssue,

    @JsonPropertyDescription("Actionable technical root cause diagnosis referencing component, stack trace, or past fix")
    String rootCauseHint,

    @JsonPropertyDescription("Polite, production-ready markdown comment to post back to the GitHub issue thread")
    String suggestedReply
) {}
