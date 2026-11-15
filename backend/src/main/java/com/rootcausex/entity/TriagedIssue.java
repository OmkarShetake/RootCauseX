package com.rootcausex.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
    name = "triaged_issues",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_repo_issue", columnNames = {"repo_full_name", "issue_number"})
    },
    indexes = {
        @Index(name = "idx_triaged_issues_repo", columnList = "repo_full_name"),
        @Index(name = "idx_triaged_issues_severity", columnList = "severity"),
        @Index(name = "idx_triaged_issues_category", columnList = "category"),
        @Index(name = "idx_triaged_issues_duplicate", columnList = "is_duplicate")
    }
)
public class TriagedIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "repo_full_name", nullable = false, length = 255)
    private String repoFullName;

    @Column(name = "issue_number", nullable = false)
    private Integer issueNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 255)
    private String author;

    @Column(length = 50)
    private String state;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 50)
    private String severity;

    @Column(name = "is_duplicate", nullable = false)
    private boolean duplicate = false;

    @Column(name = "duplicate_issue_number")
    private Integer duplicateIssueNumber;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "is_good_first_issue", nullable = false)
    private boolean goodFirstIssue = false;

    @Column(name = "root_cause_hint", columnDefinition = "TEXT")
    private String rootCauseHint;

    @Column(name = "suggested_reply", columnDefinition = "TEXT")
    private String suggestedReply;

    @Column(name = "github_created_at")
    private Instant githubCreatedAt;

    @Column(name = "triaged_at", nullable = false)
    private Instant triagedAt = Instant.now();

    @Column(name = "html_url", length = 500)
    private String htmlUrl;

    @Column(columnDefinition = "TEXT")
    private String labels;

    public TriagedIssue() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRepoFullName() { return repoFullName; }
    public void setRepoFullName(String repoFullName) { this.repoFullName = repoFullName; }

    public Integer getIssueNumber() { return issueNumber; }
    public void setIssueNumber(Integer issueNumber) { this.issueNumber = issueNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public boolean isDuplicate() { return duplicate; }
    public void setDuplicate(boolean duplicate) { this.duplicate = duplicate; }

    public Integer getDuplicateIssueNumber() { return duplicateIssueNumber; }
    public void setDuplicateIssueNumber(Integer duplicateIssueNumber) { this.duplicateIssueNumber = duplicateIssueNumber; }

    public Double getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(Double similarityScore) { this.similarityScore = similarityScore; }

    public boolean isGoodFirstIssue() { return goodFirstIssue; }
    public void setGoodFirstIssue(boolean goodFirstIssue) { this.goodFirstIssue = goodFirstIssue; }

    public String getRootCauseHint() { return rootCauseHint; }
    public void setRootCauseHint(String rootCauseHint) { this.rootCauseHint = rootCauseHint; }

    public String getSuggestedReply() { return suggestedReply; }
    public void setSuggestedReply(String suggestedReply) { this.suggestedReply = suggestedReply; }

    public Instant getGithubCreatedAt() { return githubCreatedAt; }
    public void setGithubCreatedAt(Instant githubCreatedAt) { this.githubCreatedAt = githubCreatedAt; }

    public Instant getTriagedAt() { return triagedAt; }
    public void setTriagedAt(Instant triagedAt) { this.triagedAt = triagedAt; }

    public String getHtmlUrl() { return htmlUrl; }
    public void setHtmlUrl(String htmlUrl) { this.htmlUrl = htmlUrl; }

    public String getLabels() { return labels; }
    public void setLabels(String labels) { this.labels = labels; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final TriagedIssue issue = new TriagedIssue();

        public Builder id(Long id) { issue.setId(id); return this; }
        public Builder repoFullName(String repoFullName) { issue.setRepoFullName(repoFullName); return this; }
        public Builder issueNumber(Integer issueNumber) { issue.setIssueNumber(issueNumber); return this; }
        public Builder title(String title) { issue.setTitle(title); return this; }
        public Builder body(String body) { issue.setBody(body); return this; }
        public Builder author(String author) { issue.setAuthor(author); return this; }
        public Builder state(String state) { issue.setState(state); return this; }
        public Builder category(String category) { issue.setCategory(category); return this; }
        public Builder severity(String severity) { issue.setSeverity(severity); return this; }
        public Builder duplicate(boolean duplicate) { issue.setDuplicate(duplicate); return this; }
        public Builder duplicateIssueNumber(Integer duplicateIssueNumber) { issue.setDuplicateIssueNumber(duplicateIssueNumber); return this; }
        public Builder similarityScore(Double similarityScore) { issue.setSimilarityScore(similarityScore); return this; }
        public Builder goodFirstIssue(boolean goodFirstIssue) { issue.setGoodFirstIssue(goodFirstIssue); return this; }
        public Builder rootCauseHint(String rootCauseHint) { issue.setRootCauseHint(rootCauseHint); return this; }
        public Builder suggestedReply(String suggestedReply) { issue.setSuggestedReply(suggestedReply); return this; }
        public Builder githubCreatedAt(Instant githubCreatedAt) { issue.setGithubCreatedAt(githubCreatedAt); return this; }
        public Builder triagedAt(Instant triagedAt) { issue.setTriagedAt(triagedAt); return this; }
        public Builder htmlUrl(String htmlUrl) { issue.setHtmlUrl(htmlUrl); return this; }
        public Builder labels(String labels) { issue.setLabels(labels); return this; }
        public TriagedIssue build() { return issue; }
    }
}
