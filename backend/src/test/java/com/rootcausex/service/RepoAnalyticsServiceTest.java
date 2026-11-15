package com.rootcausex.service;

import com.rootcausex.dto.RepoAnalyticsResponse;
import com.rootcausex.dto.RepoIntelligenceResponse;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.repository.TriagedIssueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RepoAnalyticsServiceTest {

    @Mock
    private TriagedIssueRepository triagedIssueRepository;

    private RepoAnalyticsService repoAnalyticsService;

    @BeforeEach
    void setUp() {
        repoAnalyticsService = new RepoAnalyticsService(triagedIssueRepository);
    }

    @Test
    @DisplayName("Should calculate analytics with component breakdown and empirical formula")
    void shouldCalculateAnalytics() {
        String repo = "spring-projects/spring-petclinic";
        when(triagedIssueRepository.countByRepoFullName(repo)).thenReturn(10L);
        when(triagedIssueRepository.countByRepoFullNameAndDuplicateTrue(repo)).thenReturn(3L);
        when(triagedIssueRepository.countByRepoFullNameAndGoodFirstIssueTrue(repo)).thenReturn(2L);
        
        List<Object[]> categoryRows = new ArrayList<>();
        categoryRows.add(new Object[]{"BUG", 6L});

        List<Object[]> severityRows = new ArrayList<>();
        severityRows.add(new Object[]{"CRITICAL", 3L});

        List<Object[]> componentRows = new ArrayList<>();
        componentRows.add(new Object[]{"database", 5L});

        when(triagedIssueRepository.countGroupByCategory(repo)).thenReturn(categoryRows);
        when(triagedIssueRepository.countGroupBySeverity(repo)).thenReturn(severityRows);
        when(triagedIssueRepository.countGroupByComponent(repo)).thenReturn(componentRows);

        RepoAnalyticsResponse res = repoAnalyticsService.getAnalytics("spring-projects", "spring-petclinic");

        assertThat(res.totalTriagedIssues()).isEqualTo(10);
        assertThat(res.duplicatesCount()).isEqualTo(3);
        assertThat(res.duplicateRate()).isEqualTo(30.0);
        assertThat(res.estimatedHoursSaved()).isEqualTo(7.5);
        assertThat(res.componentBreakdown()).containsEntry("database", 5L);
        assertThat(res.formulaExplanation()).contains("2.5 hours");
    }

    @Test
    @DisplayName("Should identify component hotspots and recurring defect clusters in intelligence report")
    void shouldComputeIntelligenceReport() {
        String repo = "spring-projects/spring-petclinic";
        TriagedIssue issue1 = TriagedIssue.builder()
            .repoFullName(repo)
            .issueNumber(201)
            .component("database")
            .severity("CRITICAL")
            .duplicate(true)
            .duplicateIssueNumber(101)
            .rootCauseHint("HikariCP connection pool exhaustion")
            .build();

        TriagedIssue issue2 = TriagedIssue.builder()
            .repoFullName(repo)
            .issueNumber(202)
            .component("database")
            .severity("HIGH")
            .duplicate(false)
            .rootCauseHint("Query timeout")
            .build();

        when(triagedIssueRepository.findByRepoFullNameOrderByIssueNumberDesc(repo))
            .thenReturn(List.of(issue1, issue2));

        RepoIntelligenceResponse intel = repoAnalyticsService.getIntelligence("spring-projects", "spring-petclinic");

        assertThat(intel.repoFullName()).isEqualTo(repo);
        assertThat(intel.componentHotspots()).isNotEmpty();
        assertThat(intel.componentHotspots().get(0).component()).isEqualTo("database");
        assertThat(intel.recurringDefectClusters()).isNotEmpty();
        assertThat(intel.recurringDefectClusters().get(0).issueNumbers()).contains(101, 201);
    }
}
