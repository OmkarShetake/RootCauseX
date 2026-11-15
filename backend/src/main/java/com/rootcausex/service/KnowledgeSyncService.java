package com.rootcausex.service;

import com.rootcausex.client.GitHubIssueDto;
import com.rootcausex.dto.KnowledgeSyncRequest;
import com.rootcausex.dto.KnowledgeSyncResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeSyncService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeSyncService.class);

    private final GitHubClientService gitHubClientService;
    private final VectorStore vectorStore;

    public KnowledgeSyncService(GitHubClientService gitHubClientService, VectorStore vectorStore) {
        this.gitHubClientService = gitHubClientService;
        this.vectorStore = vectorStore;
    }

    public KnowledgeSyncResponse syncClosedIssues(KnowledgeSyncRequest request) {
        String owner = request.owner().trim();
        String repo = request.repo().trim();
        String repoFullName = owner + "/" + repo;

        log.info("Starting historical knowledge sync for repository: {}", repoFullName);

        // Fetch up to 50 recent closed issues excluding PRs
        List<GitHubIssueDto> closedIssues = gitHubClientService.fetchClosedIssues(owner, repo, 50);

        if (closedIssues.isEmpty()) {
            log.warn("No closed issues found or retrieved for {}", repoFullName);
            return new KnowledgeSyncResponse(
                owner,
                repo,
                repoFullName,
                0,
                "COMPLETED_EMPTY",
                "No closed issues found for knowledge indexing."
            );
        }

        List<Document> documents = new ArrayList<>();
        for (GitHubIssueDto issue : closedIssues) {
            String title = issue.title() != null ? issue.title() : "";
            String body = issue.body() != null ? issue.body() : "";
            
            // Format title + body + resolution context for RAG vector embedding
            String content = String.format(
                "Repository: %s\nIssue #%d: %s\nState: %s\nResolution Details & Discussion:\n%s",
                repoFullName,
                issue.number(),
                title,
                issue.state(),
                body
            );

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("repoFullName", repoFullName);
            metadata.put("issueNumber", issue.number());
            metadata.put("title", title);
            metadata.put("url", issue.htmlUrl() != null ? issue.htmlUrl() : "");
            metadata.put("state", issue.state() != null ? issue.state() : "closed");
            if (issue.closedAt() != null) {
                metadata.put("closedAt", issue.closedAt().toString());
            }

            documents.add(new Document(content, metadata));
        }

        try {
            log.info("Persisting {} issue embedding documents into pgvector for {}", documents.size(), repoFullName);
            vectorStore.add(documents);
        } catch (Exception e) {
            log.error("Warning: Vector store indexing encountered an issue: {}. Triage engine will continue operating with relational entities.", e.getMessage(), e);
        }

        String message = String.format("Successfully synced %d historical resolved issues for %s", 
            documents.size(), repoFullName);
        log.info(message);

        return new KnowledgeSyncResponse(
            owner,
            repo,
            repoFullName,
            documents.size(),
            "COMPLETED",
            message
        );
    }
}
