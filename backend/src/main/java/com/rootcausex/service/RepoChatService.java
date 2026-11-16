package com.rootcausex.service;

import com.rootcausex.dto.AskRepoRequest;
import com.rootcausex.dto.AskRepoResponse;
import com.rootcausex.dto.AskRepoResponse.CitedIssue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RepoChatService {

    private static final Logger log = LoggerFactory.getLogger(RepoChatService.class);
    private static final double RELEVANCE_THRESHOLD = 0.60;

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    public RepoChatService(VectorStore vectorStore, ChatClient chatClient) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClient;
    }

    public AskRepoResponse askRepository(String owner, String repo, AskRepoRequest request) {
        String repoFullName = owner + "/" + repo;
        String question = request.question().trim();
        log.info("Processing repository-filtered RAG query for {}: '{}'", repoFullName, question);

        // Vector similarity search — tries with filter first (pgvector), falls back to in-memory filter (SimpleVectorStore)
        List<Document> similarDocs = new ArrayList<>();
        try {
            SearchRequest searchRequest = SearchRequest.builder()
                .query(question)
                .topK(5)
                .similarityThreshold(0.25)
                .filterExpression("repoFullName == '" + repoFullName + "'")
                .build();
            List<Document> results = vectorStore.similaritySearch(searchRequest);
            if (results != null) {
                similarDocs = results.stream()
                    .filter(doc -> repoFullName.equals(doc.getMetadata().get("repoFullName")))
                    .toList();
            }
        } catch (Exception e) {
            // SimpleVectorStore doesn't support filterExpression — retry without filter and apply in memory
            log.debug("Vector filter search failed ({}), retrying without filter expression.", e.getMessage());
            try {
                SearchRequest fallbackRequest = SearchRequest.builder()
                    .query(question)
                    .topK(10)
                    .similarityThreshold(0.25)
                    .build();
                List<Document> results = vectorStore.similaritySearch(fallbackRequest);
                if (results != null) {
                    similarDocs = results.stream()
                        .filter(doc -> repoFullName.equals(doc.getMetadata().get("repoFullName")))
                        .toList();
                }
            } catch (Exception e2) {
                log.warn("Vector search failed entirely during ask query: {}", e2.getMessage());
            }
        }

        // Check if top document meets the minimum relevance threshold
        boolean hasRelevantMatch = !similarDocs.isEmpty() && 
            similarDocs.stream().anyMatch(d -> d.getScore() != null && d.getScore() >= RELEVANCE_THRESHOLD);

        if (!hasRelevantMatch) {
            log.info("No documents met relevance threshold ({}) for query '{}' in {}", RELEVANCE_THRESHOLD, question, repoFullName);
            return new AskRepoResponse(
                question,
                repoFullName,
                String.format("No verified historical issues matching this technical inquiry exist in repository %s. " +
                    "Try syncing closed issues first via Knowledge Sync, or query with specific error codes or architectural components.", repoFullName),
                List.of()
            );
        }

        List<CitedIssue> citedIssues = new ArrayList<>();
        StringBuilder contextText = new StringBuilder();

        for (Document doc : similarDocs) {
            double score = doc.getScore() != null ? doc.getScore() : 0.80;
            if (score < 0.50) {
                continue; // Skip weak matches
            }

            Object numObj = doc.getMetadata().get("issueNumber");
            int issueNum = 0;
            if (numObj instanceof Number n) {
                issueNum = n.intValue();
            } else if (numObj != null) {
                try {
                    issueNum = Integer.parseInt(numObj.toString());
                } catch (Exception ignored) {}
            }

            String title = (String) doc.getMetadata().getOrDefault("title", "Historical Issue #" + issueNum);
            String url = (String) doc.getMetadata().getOrDefault("url", "https://github.com/" + repoFullName + "/issues/" + issueNum);
            String state = (String) doc.getMetadata().getOrDefault("state", "closed");
            String closedAt = (String) doc.getMetadata().getOrDefault("closedAt", null);

            String fullText = doc.getText() != null ? doc.getText() : "";
            String excerpt = fullText.length() > 200 ? fullText.substring(0, 200) + "..." : fullText;

            citedIssues.add(new CitedIssue(issueNum, title, url, score, state, closedAt, excerpt));
            contextText.append(String.format("Historical Issue #%d: %s\n%s\n---\n", issueNum, title, fullText));
        }

        String prompt = """
            You are RootCauseX AI assistant. A developer is asking a technical question about the repository '%s'.
            Answer the question based STRICTLY and ONLY on the verified historical issues provided in the context below.
            Cite exact issue numbers (e.g. Issue #%d) and specify the resolution pattern implemented.
            If the context does not contain enough evidence to answer authoritatively, state: "Insufficient historical evidence in repository %s to answer this specific inquiry."
            
            Question: %s
            
            Verified Historical Knowledge Base:
            %s
            """.formatted(repoFullName, citedIssues.get(0).issueNumber(), repoFullName, question, contextText);

        String answer;
        try {
            answer = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
            if (answer == null || answer.isBlank()) {
                throw new IllegalStateException("Empty LLM response");
            }
        } catch (Exception e) {
            log.warn("ChatClient prompt call failed or returned empty: {}. Generating grounded contextual synthesis.", e.getMessage());
            CitedIssue topMatch = citedIssues.get(0);
            answer = String.format(
                "Based on verified historical issues in `%s`, the closest match is **Issue #%d** (\"%s\").\n\n" +
                "**Historical Resolution Summary:**\n%s\n\n" +
                "Refer to the citation card below for direct GitHub thread verification.",
                repoFullName,
                topMatch.issueNumber(),
                topMatch.title(),
                topMatch.excerpt()
            );
        }

        return new AskRepoResponse(
            question,
            repoFullName,
            answer,
            citedIssues
        );
    }
}
