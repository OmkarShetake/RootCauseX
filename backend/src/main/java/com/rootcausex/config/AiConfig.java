package com.rootcausex.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.dto.RootCauseAnalysis;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.document.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Configuration
public class AiConfig {

    private static final Logger log = LoggerFactory.getLogger(AiConfig.class);

    @Value("${spring.ai.openai.api-key:mock-key}")
    private String apiKey;

    @Value("${rootcausex.ai.mock-mode:auto}")
    private String mockMode;

    private final ObjectMapper objectMapper;

    public AiConfig() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        this.objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public boolean isMockRequired() {
        if ("true".equalsIgnoreCase(mockMode)) {
            return true;
        }
        return apiKey == null || apiKey.trim().isEmpty() || "mock-key".equalsIgnoreCase(apiKey.trim());
    }

    @Bean
    @Primary
    public ChatModel chatModel(ChatModel openAiChatModel) {
        if (isMockRequired()) {
            log.info("Active AI Mode: MOCK / HEURISTIC FALLBACK (no external API key required). Running deterministic local triage engine.");
            return new IntelligentMockChatModel(objectMapper);
        }
        log.info("Active AI Mode: LIVE OPENAI / GEMINI COMPATIBLE ChatModel");
        return openAiChatModel;
    }

    @Bean
    @Primary
    public EmbeddingModel embeddingModel(EmbeddingModel openAiEmbeddingModel) {
        if (isMockRequired()) {
            log.info("Active Embedding Mode: LOCAL DETERMINISTIC EMBEDDINGS (1536 dimensions)");
            return new DeterministicMockEmbeddingModel();
        }
        log.info("Active Embedding Mode: LIVE EMBEDDING MODEL");
        return openAiEmbeddingModel;
    }

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }

    /**
     * Intelligent Mock ChatModel producing realistic RootCauseAnalysis JSON when in mock mode.
     */
    public static class IntelligentMockChatModel implements ChatModel {
        private final ObjectMapper objectMapper;

        public IntelligentMockChatModel(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }

        @Override
        public ChatResponse call(Prompt prompt) {
            String userMessage = prompt.getInstructions().get(0).getText();
            String lower = userMessage.toLowerCase();

            String category = "BUG";
            String severity = "MEDIUM";
            boolean isGoodFirst = false;
            String rootCause = "Investigation indicates potential null reference or state mismanagement in the service layer.";
            String replyIntro = "Thank you for reporting this issue!";

            if (lower.contains("vulnerability") || lower.contains("cve") || lower.contains("exploit") || lower.contains("auth") || lower.contains("token")) {
                category = "SECURITY";
                severity = "CRITICAL";
                rootCause = "High-risk security surface detected: Potential credential leakage or improper authorization check in security filter chain.";
                replyIntro = "Security issue acknowledged with highest priority. Investigating authorization check bypass.";
            } else if (lower.contains("deadlock") || lower.contains("oom") || lower.contains("outofmemory") || lower.contains("crash") || lower.contains("timeout") || lower.contains("pool")) {
                category = "BUG";
                severity = "CRITICAL";
                rootCause = "Resource starvation / connection pool exhaustion detected. Check HikariCP connection leak timeouts or unclosed JDBC statements.";
                replyIntro = "Critical system impact detected. Prioritizing diagnostic thread dump and connection pool metrics analysis.";
            } else if (lower.contains("doc") || lower.contains("readme") || lower.contains("typo") || lower.contains("guide")) {
                category = "DOCS";
                severity = "LOW";
                isGoodFirst = true;
                rootCause = "Documentation or typo discrepancy in reference manuals. Clean markdown update required.";
                replyIntro = "Thanks for spotting this documentation inconsistency! PRs are warmly welcome.";
            } else if (lower.contains("feature") || lower.contains("support for") || lower.contains("add ") || lower.contains("enhance")) {
                category = "FEATURE";
                severity = "MEDIUM";
                isGoodFirst = lower.contains("easy") || lower.contains("simple");
                rootCause = "Feature request requires extension of existing configuration interfaces or API contract expansion.";
                replyIntro = "Thank you for the feature suggestion! This aligns well with the roadmap.";
            } else if (lower.contains("nullpointer") || lower.contains("npe") || lower.contains("exception")) {
                category = "BUG";
                severity = "HIGH";
                isGoodFirst = lower.contains("simple") || lower.contains("label");
                rootCause = "Null safety violation during entity mapping or unhandled Optional unwrap in controller/service boundary.";
                replyIntro = "Reproduced stack trace. Investigating null reference boundary.";
            }

            // Check if prompt references duplicate candidate
            boolean isDuplicate = false;
            Integer duplicateNumber = null;
            double similarity = 0.45;
            if (lower.contains("duplicate") || lower.contains("similar past issue #")) {
                isDuplicate = true;
                duplicateNumber = 42;
                similarity = 0.92;
            }

            RootCauseAnalysis mockAnalysis = new RootCauseAnalysis(
                category,
                severity,
                isDuplicate,
                duplicateNumber,
                similarity,
                isGoodFirst,
                rootCause,
                replyIntro + "\n\nWe have automatically triaged this issue. Similar technical patterns were analyzed against the repository knowledge base. Please let us know if additional repro steps are available."
            );

            try {
                String json = objectMapper.writeValueAsString(mockAnalysis);
                return new ChatResponse(List.of(new Generation(new AssistantMessage(json))));
            } catch (Exception e) {
                return new ChatResponse(List.of(new Generation(new AssistantMessage("{}"))));
            }
        }

        @Override
        public ChatOptions getDefaultOptions() {
            return ChatOptions.builder().build();
        }
    }

    /**
     * Deterministic Embedding Model producing repeatable 1536-dimensional vectors based on text hashing.
     */
    public static class DeterministicMockEmbeddingModel implements EmbeddingModel {
        private static final int DIMENSIONS = 1536;

        @Override
        public EmbeddingResponse call(EmbeddingRequest request) {
            List<Embedding> embeddings = new ArrayList<>();
            int index = 0;
            for (String text : request.getInstructions()) {
                embeddings.add(new Embedding(generateVector(text), index++));
            }
            return new EmbeddingResponse(embeddings);
        }

        @Override
        public float[] embed(Document document) {
            return generateVector(document.getText());
        }

        private float[] generateVector(String text) {
            float[] vector = new float[DIMENSIONS];
            if (text == null) text = "";
            long seed = text.hashCode();
            Random rng = new Random(seed);
            float sumSq = 0f;
            for (int i = 0; i < DIMENSIONS; i++) {
                vector[i] = (float) (rng.nextGaussian());
                sumSq += vector[i] * vector[i];
            }
            float norm = (float) Math.sqrt(sumSq);
            if (norm > 0) {
                for (int i = 0; i < DIMENSIONS; i++) {
                    vector[i] /= norm;
                }
            }
            return vector;
        }

        @Override
        public int dimensions() {
            return DIMENSIONS;
        }
    }
}
