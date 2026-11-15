package com.rootcausex.dto;

import java.util.List;

public record AskRepoResponse(
    String question,
    String repoFullName,
    String answer,
    List<CitedIssue> citedIssues
) {
    public record CitedIssue(
        int issueNumber,
        String title,
        String url,
        double similarity,
        String state,
        String closedAt,
        String excerpt
    ) {
        public CitedIssue(int issueNumber, String title, String url, double similarity) {
            this(issueNumber, title, url, similarity, "closed", null, null);
        }
    }
}
