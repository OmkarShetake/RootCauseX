package com.rootcausex.scheduler;

import com.rootcausex.dto.StaleCheckResponse;
import com.rootcausex.dto.StaleIssueAlert;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.repository.TriagedIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Component
public class StaleIssueScheduler {

    private static final Logger log = LoggerFactory.getLogger(StaleIssueScheduler.class);

    private final TriagedIssueRepository triagedIssueRepository;

    @Value("${rootcausex.stale-threshold-days:7}")
    private long staleThresholdDays;

    public StaleIssueScheduler(TriagedIssueRepository triagedIssueRepository) {
        this.triagedIssueRepository = triagedIssueRepository;
    }

    /**
     * Scheduled daily cron job at 09:00 AM server time.
     */
    @Scheduled(cron = "${rootcausex.stale-cron:0 0 9 * * *}")
    public void runDailyStaleIssueCheck() {
        log.info("[CRON TRIGGER] Executing scheduled scan for stale unresolved CRITICAL & HIGH issues (> {} days old)...", staleThresholdDays);
        StaleCheckResponse report = checkStaleIssues();
        log.info("[CRON SUMMARY] Stale Scan Complete: Found {} critical/high stale issues needing escalation.", report.staleCriticalCount());
    }

    /**
     * Programmatic check callable by both scheduler and manual interview trigger endpoint.
     */
    public StaleCheckResponse checkStaleIssues() {
        Instant cutoff = Instant.now().minus(staleThresholdDays, ChronoUnit.DAYS);
        List<String> severities = List.of("CRITICAL", "HIGH");

        List<TriagedIssue> staleEntities = triagedIssueRepository.findStaleIssues("OPEN", severities, cutoff);
        List<StaleIssueAlert> alerts = new ArrayList<>();

        for (TriagedIssue issue : staleEntities) {
            long daysOpen = 0;
            if (issue.getGithubCreatedAt() != null) {
                daysOpen = Duration.between(issue.getGithubCreatedAt(), Instant.now()).toDays();
            }

            StaleIssueAlert alert = new StaleIssueAlert(
                issue.getRepoFullName(),
                issue.getIssueNumber(),
                issue.getTitle(),
                issue.getSeverity(),
                issue.getCategory(),
                daysOpen,
                issue.getGithubCreatedAt(),
                issue.getHtmlUrl()
            );
            alerts.add(alert);

            log.warn("[STALE ISSUE ESCALATION] [{}] {} Issue #{} ('{}') has been OPEN for {} days! Action required immediately.",
                issue.getSeverity(), issue.getRepoFullName(), issue.getIssueNumber(), issue.getTitle(), daysOpen);
        }

        long criticalCount = alerts.stream().filter(a -> "CRITICAL".equalsIgnoreCase(a.severity())).count();
        String summary = String.format("Stale Issue Scan identified %d unaddressed high/critical issues (%d CRITICAL, %d HIGH) exceeding %d-day threshold.",
            alerts.size(), criticalCount, alerts.size() - criticalCount, staleThresholdDays);

        return new StaleCheckResponse(
            alerts.size(),
            (int) criticalCount,
            alerts,
            summary
        );
    }
}
