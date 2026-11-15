package com.rootcausex.service;

import com.rootcausex.dto.RepoAnalyticsResponse;
import com.rootcausex.repository.TriagedIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RepoAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(RepoAnalyticsService.class);
    private static final double HOURS_SAVED_PER_DUPLICATE = 2.5;

    private final TriagedIssueRepository triagedIssueRepository;

    public RepoAnalyticsService(TriagedIssueRepository triagedIssueRepository) {
        this.triagedIssueRepository = triagedIssueRepository;
    }

    @Transactional(readOnly = true)
    public RepoAnalyticsResponse getAnalytics(String owner, String repo) {
        String repoFullName = owner + "/" + repo;
        log.info("Calculating repository health analytics for: {}", repoFullName);

        long total = triagedIssueRepository.countByRepoFullName(repoFullName);
        long duplicates = triagedIssueRepository.countByRepoFullNameAndDuplicateTrue(repoFullName);
        long goodFirstIssues = triagedIssueRepository.countByRepoFullNameAndGoodFirstIssueTrue(repoFullName);

        double duplicateRate = total > 0 ? ((double) duplicates / total) * 100.0 : 0.0;
        double hoursSaved = duplicates * HOURS_SAVED_PER_DUPLICATE;

        Map<String, Long> categoryMap = new HashMap<>();
        List<Object[]> categoryCounts = triagedIssueRepository.countGroupByCategory(repoFullName);
        for (Object[] row : categoryCounts) {
            String cat = (String) row[0];
            Long cnt = (Long) row[1];
            if (cat != null) categoryMap.put(cat.toUpperCase(), cnt);
        }

        Map<String, Long> severityMap = new HashMap<>();
        List<Object[]> severityCounts = triagedIssueRepository.countGroupBySeverity(repoFullName);
        for (Object[] row : severityCounts) {
            String sev = (String) row[0];
            Long cnt = (Long) row[1];
            if (sev != null) severityMap.put(sev.toUpperCase(), cnt);
        }

        // Fill zero counts for standard categories/severities
        for (String cat : List.of("BUG", "SECURITY", "FEATURE", "DOCS")) {
            categoryMap.putIfAbsent(cat, 0L);
        }
        for (String sev : List.of("CRITICAL", "HIGH", "MEDIUM", "LOW")) {
            severityMap.putIfAbsent(sev, 0L);
        }

        return new RepoAnalyticsResponse(
            repoFullName,
            total,
            duplicates,
            Math.round(duplicateRate * 10.0) / 10.0,
            goodFirstIssues,
            hoursSaved,
            categoryMap,
            severityMap
        );
    }
}
