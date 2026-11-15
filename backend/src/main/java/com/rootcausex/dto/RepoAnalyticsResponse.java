package com.rootcausex.dto;

import java.util.Map;

public record RepoAnalyticsResponse(
    String repoFullName,
    long totalTriagedIssues,
    long duplicatesCount,
    double duplicateRate,
    long goodFirstIssuesCount,
    double estimatedHoursSaved,
    Map<String, Long> categoryBreakdown,
    Map<String, Long> severityBreakdown
) {}
