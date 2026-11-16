package com.rootcausex.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.client.GitHubSourceFile;
import com.rootcausex.dto.CodePatchResponse;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.repository.TriagedIssueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodePatchServiceTest {

    @Mock private TriagedIssueRepository triagedIssueRepository;
    @Mock private IssueTriageService issueTriageService;
    @Mock private GitHubClientService gitHubClientService;
    @Mock private ChatClient chatClient;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOperations;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private CodePatchService codePatchService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        codePatchService = new CodePatchService(
            triagedIssueRepository,
            issueTriageService,
            gitHubClientService,
            chatClient,
            redisTemplate,
            objectMapper
        );
        ReflectionTestUtils.setField(codePatchService, "cacheTtlHours", 24L);
    }

    @Test
    @DisplayName("Should return cached CodePatchResponse on Redis hit without calling AI or GitHub")
    void shouldReturnCachedPatchOnRedisHit() {
        String cacheKey = "rootcausex:patch:spring-projects:spring-petclinic:201";
        CodePatchResponse cached = new CodePatchResponse(
            "src/main/java/com/example/DatabaseConfig.java",
            "Cached explanation",
            "original snippet",
            "patched snippet",
            "--- a/file\n+++ b/file\n@@ -1 +1 @@"
        );

        when(valueOperations.get(cacheKey)).thenReturn(cached);

        CodePatchResponse result = codePatchService.generatePatch("spring-projects", "spring-petclinic", 201);

        assertThat(result).isNotNull();
        assertThat(result.targetFile()).isEqualTo("src/main/java/com/example/DatabaseConfig.java");
        assertThat(result.explanation()).isEqualTo("Cached explanation");

        // AI and GitHub must NOT be called on cache hit
        verifyNoInteractions(gitHubClientService);
        verifyNoInteractions(chatClient);
    }

    @Test
    @DisplayName("Should call AI pipeline and cache result on Redis cache miss")
    void shouldCallAiAndCacheOnCacheMiss() {
        // Redis miss
        when(valueOperations.get(anyString())).thenReturn(null);

        // Existing triage record — avoids GitHub API call for auto-triage
        TriagedIssue triaged = TriagedIssue.builder()
            .repoFullName("spring-projects/spring-petclinic")
            .issueNumber(201)
            .title("HikariCP pool exhaustion")
            .rootCauseHint("Connection pool starvation under load")
            .component("database")
            .build();
        when(triagedIssueRepository.findByRepoFullNameAndIssueNumber(anyString(), anyInt()))
            .thenReturn(Optional.of(triaged));

        // Source file fetch returns a valid file
        GitHubSourceFile sourceFile = new GitHubSourceFile(
            "src/main/java/com/example/DatabaseConfig.java",
            "public class DatabaseConfig { /* ... */ }"
        );
        when(gitHubClientService.fetchBestSourceFile(anyString(), anyString(), anyString()))
            .thenReturn(sourceFile);

        // ChatClient mock returns a valid CodePatchResponse via deep stubbing
        ChatClient.ChatClientRequestSpec requestSpec = mock(ChatClient.ChatClientRequestSpec.class, RETURNS_DEEP_STUBS);
        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.user(anyString())).thenReturn(requestSpec);
        CodePatchResponse aiResponse = new CodePatchResponse(
            "src/main/java/com/example/DatabaseConfig.java",
            "Add leakDetectionThreshold to HikariCP config",
            "    config.setConnectionTimeout(30000);",
            "    config.setConnectionTimeout(30000);\n    config.setLeakDetectionThreshold(2000);",
            "--- a/DatabaseConfig.java\n+++ b/DatabaseConfig.java"
        );
        when(requestSpec.call().entity(CodePatchResponse.class)).thenReturn(aiResponse);

        CodePatchResponse result = codePatchService.generatePatch("spring-projects", "spring-petclinic", 201);

        // Result must be non-null and have required fields
        assertThat(result).isNotNull();
        assertThat(result.targetFile()).isNotNull();
        assertThat(result.explanation()).isNotNull();

        // Verify source file was fetched (cache miss triggered the pipeline)
        verify(gitHubClientService).fetchBestSourceFile(eq("spring-projects"), eq("spring-petclinic"), anyString());

        // Verify result was stored in Redis
        verify(valueOperations).set(startsWith("rootcausex:patch:"), any(), any());
    }
}
