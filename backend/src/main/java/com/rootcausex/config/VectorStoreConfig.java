package com.rootcausex.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore.PgDistanceType;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore.PgIndexType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
public class VectorStoreConfig {

    private static final Logger log = LoggerFactory.getLogger(VectorStoreConfig.class);

    @Bean
    @Primary
    public VectorStore vectorStore(JdbcTemplate jdbcTemplate, DataSource dataSource, EmbeddingModel embeddingModel) {
        try {
            // Check if PostgreSQL database is available and supports pgvector
            try (Connection conn = dataSource.getConnection()) {
                String dbProduct = conn.getMetaData().getDatabaseProductName();
                log.info("Detected database product: {}", dbProduct);
                if (dbProduct != null && dbProduct.toLowerCase().contains("postgresql")) {
                    log.info("PostgreSQL detected! Initializing production PgVectorStore with HNSW indexing and COSINE_DISTANCE.");
                    return PgVectorStore.builder(jdbcTemplate, embeddingModel)
                        .dimensions(embeddingModel.dimensions())
                        .distanceType(PgDistanceType.COSINE_DISTANCE)
                        .indexType(PgIndexType.HNSW)
                        .initializeSchema(true)
                        .schemaName("public")
                        .vectorTableName("vector_store")
                        .build();
                }
            }
        } catch (Exception e) {
            log.warn("PostgreSQL / pgvector connection check could not be established ({}: {}). Falling back to in-memory SimpleVectorStore.", 
                e.getClass().getSimpleName(), e.getMessage());
        }

        log.info("Initializing SimpleVectorStore in-memory fallback for ACID & vector testing.");
        return SimpleVectorStore.builder(embeddingModel).build();
    }
}
