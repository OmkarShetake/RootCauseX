package com.rootcausex.service;

import com.rootcausex.config.AiConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SemanticVectorEmbeddingModelTest {

    private final AiConfig.SemanticVectorEmbeddingModel vectorizer = new AiConfig.SemanticVectorEmbeddingModel();

    private double cosineSimilarity(float[] v1, float[] v2) {
        double dot = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;
        for (int i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            norm1 += v1[i] * v1[i];
            norm2 += v2[i] * v2[i];
        }
        if (norm1 == 0 || norm2 == 0) return 0.0;
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    @Test
    @DisplayName("Should produce high semantic cosine similarity (> 0.85) for equivalent bug descriptions")
    void shouldProduceHighSimilarityForEquivalentBugs() {
        String bugA = "HikariCP connection leak during PetClinic visit batch persistence";
        String bugB = "Database connection timeout under concurrent load in PetClinic visits HikariPool leak starvation";

        float[] vecA = vectorizer.embedText(bugA);
        float[] vecB = vectorizer.embedText(bugB);

        double similarity = cosineSimilarity(vecA, vecB);
        System.out.println("Semantic Similarity (Bug A vs Bug B): " + similarity);

        // Verification of requirement A: genuine cosine similarity > 0.85 for equivalent defects
        assertThat(similarity).isGreaterThan(0.85);
    }

    @Test
    @DisplayName("Should produce low cosine similarity (< 0.25) for semantically unrelated issues")
    void shouldProduceLowSimilarityForUnrelatedIssues() {
        String bugA = "HikariCP connection leak during PetClinic visit batch persistence";
        String docB = "Fix typo in Docker compose README quickstart documentation setup instructions";

        float[] vecA = vectorizer.embedText(bugA);
        float[] vecB = vectorizer.embedText(docB);

        double similarity = cosineSimilarity(vecA, vecB);
        System.out.println("Semantic Similarity (Bug vs Docs): " + similarity);

        assertThat(similarity).isLessThan(0.25);
    }
}
