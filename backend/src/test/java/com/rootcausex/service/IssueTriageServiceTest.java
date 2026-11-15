package com.rootcausex.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.client.GitHubIssueDto;
import com.rootcausex.client.GitHubUserDto;
import com.rootcausex.dto.TriagedIssueResponse;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.repository.TriagedIssueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueTriageServiceTest {

    @Mock
    private GitHubClientService gitHubClientService;

    @Mock
    private TriagedIssueRepository triagedIssueRepository;

    @Mock
    private VectorStore vectorStore;

    @Mock
    private ChatClient chatClient;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private IssueTriageService issueTriageService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        issueTriageService = new IssueTriageService(
            gitHubClientService,
            triagedIssueRepository,
            vectorStore,
            chatClient,
            redisTemplate,
            objectMapper
        );

        ReflectionTestUtils.setField(issueTriageService, "duplicateThreshold", 0.88);
        ReflectionTestUtils.setField(issueTriageService, "triageTtlHours", 24L);
    }

    @Test
    @DisplayName("Should return cached triage response when present in Redis")
    void shouldReturnCachedResponseOnRedisHit() {
        String cacheKey = "rootcausex:triage:spring-projects:spring-petclinic:201";
        TriagedIssueResponse cachedResponse = new TriagedIssueResponse(
            1L,
            "spring-projects/spring-petclinic",
            201,
            "Database connection timeout",
            "Details...",
            "tester",
            "OPEN",
            "BUG",
            "CRITICAL",
            "database",
            0.95,
            "HISTORICAL_MATCH",
            false,
            null,
            0.0,
            "No duplicate",
            false,
            "HikariCP pool leak",
            "Looking into it.",
            Instant.now(),
            Instant.now(),
            "https://github.com/...",
            List.of("bug")
        );

        when(valueOperations.get(cacheKey)).thenReturn(cachedResponse);

        TriagedIssueResponse result = issueTriageService.triageSingleIssue(
            "spring-projects", "spring-petclinic", 201,
            new GitHubIssueDto(1L, 201, "Database connection timeout", "body", "open", "", null, null, Instant.now(), null, null, null)
        );

        assertThat(result).isNotNull();
        assertThat(result.issueNumber()).isEqualTo(201);
        assertThat(result.severity()).isEqualTo("CRITICAL");

        // Verify LLM and DB were NOT invoked on cache hit
        verifyNoInteractions(vectorStore);
        verify(triagedIssueRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should flag duplicate when pgvector similarity exceeds 0.88 threshold")
    void shouldFlagDuplicateWhenVectorSimilarityExceedsThreshold() {
        int issueNum = 205;
        GitHubIssueDto incomingIssue = new GitHubIssueDto(
            5L, issueNum, "HikariCP pool exhaustion under load", "Requests time out waiting for db connection", "open", "url",
            new GitHubUserDto("dev", 1L, "", ""), List.of(), Instant.now(), null, null, null
        );

        // Redis cache miss
        when(valueOperations.get(anyString())).thenReturn(null);

        // Vector store returns similar historical issue with score 0.93 (>= 0.88)
        Document similarDoc = Document.builder()
            .text("HikariCP connection leak fixed")
            .metadata(Map.of("repoFullName", "spring-projects/spring-petclinic", "issueNumber", 101, "title", "HikariCP leak"))
            .score(0.93)
            .build();

        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of(similarDoc));
        when(triagedIssueRepository.findByRepoFullNameAndIssueNumber(anyString(), anyInt())).thenReturn(Optional.empty());

        when(triagedIssueRepository.save(any(TriagedIssue.class))).thenAnswer(invocation -> {
            TriagedIssue entity = invocation.getArgument(0);
            entity.setId(10L);
            return entity;
        });

        TriagedIssueResponse response = issueTriageService.triageSingleIssue(
            "spring-projects", "spring-petclinic", issueNum, incomingIssue
        );

        assertThat(response).isNotNull();
        assertThat(response.isDuplicate()).isTrue();
        assertThat(response.duplicateIssueNumber()).isEqualTo(101);
        assertThat(response.similarityScore()).isGreaterThanOrEqualTo(0.88);
        assertThat(response.similarityExplanation()).contains("Matches historical issue #101");
        assertThat(response.evidenceSource()).isEqualTo("HISTORICAL_MATCH");

        // Verify persisted and saved to Redis
        verify(triagedIssueRepository).save(any(TriagedIssue.class));
        verify(valueOperations).set(startsWith("rootcausex:triage:"), any(), any());
    }

    @Test
    @DisplayName("Should classify documentation typo as Good First Issue and Low severity")
    void shouldClassifyDocTypoAsGoodFirstIssue() {
        int issueNum = 203;
        GitHubIssueDto docIssue = new GitHubIssueDto(
            6L, issueNum, "Typo in README markdown instructions", "Found a typo on line 42", "open", "url",
            new GitHubUserDto("contributor", 2L, "", ""), List.of(), Instant.now(), null, null, null
        );

        when(valueOperations.get(anyString())).thenReturn(null);
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of());
        when(triagedIssueRepository.findByRepoFullNameAndIssueNumber(anyString(), anyInt())).thenReturn(Optional.empty());
        when(triagedIssueRepository.save(any(TriagedIssue.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TriagedIssueResponse response = issueTriageService.triageSingleIssue(
            "spring-projects", "spring-petclinic", issueNum, docIssue
        );

        assertThat(response.category()).isEqualTo("DOCS");
        assertThat(response.severity()).isEqualTo("LOW");
        assertThat(response.component()).isEqualTo("docs");
        assertThat(response.isGoodFirstIssue()).isTrue();
    }
}
