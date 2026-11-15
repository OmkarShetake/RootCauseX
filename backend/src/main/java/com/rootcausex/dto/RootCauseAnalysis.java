package com.rootcausex.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record RootCauseAnalysis(
    @JsonPropertyDescription("Issue category: BUG, SECURITY, FEATURE, or DOCS")
    String category,

    @JsonPropertyDescription("Issue severity: CRITICAL, HIGH, MEDIUM, or LOW")
    String severity,

    @JsonPropertyDescription("Architectural component or module affected (e.g. database, security, web, core, config, ui)")
    String component,

    @JsonPropertyDescription("Diagnostic confidence score from 0.0 (uncertain/insufficient evidence) to 1.0 (verified by historical match or stack trace)")
    Double confidenceScore,

    @JsonPropertyDescription("Primary evidence source: HISTORICAL_MATCH, STACK_TRACE_ANALYSIS, or HEURISTIC")
    String evidenceSource,

    @JsonPropertyDescription("Whether this issue is a duplicate of a previously resolved issue")
    boolean isDuplicate,

    @JsonPropertyDescription("Issue number of the duplicate past issue, or null if not duplicate")
    Integer duplicateIssueNumber,

    @JsonPropertyDescription("Similarity score from 0.0 to 1.0 comparing to the closest historical issue")
    double similarityScore,

    @JsonPropertyDescription("Technical explanation describing why the issues are semantically identical or related (matching signatures, failure steps)")
    String similarityExplanation,

    @JsonPropertyDescription("True if isolated, well-defined scope suitable for new open-source contributors")
    boolean isGoodFirstIssue,

    @JsonPropertyDescription("Actionable technical root cause diagnosis grounded strictly in provided evidence")
    String rootCauseHint,

    @JsonPropertyDescription("Polite, production-ready markdown comment to post back to the GitHub issue thread")
    String suggestedReply
) {}
