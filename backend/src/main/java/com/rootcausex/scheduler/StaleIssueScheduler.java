package com.rootcausex.scheduler;

import com.rootcausex.dto.StaleCheckResponse;
import com.rootcausex.dto.StaleIssueAlert;
import com.rootcausex.entity.TriagedIssue;
import com.rootcausex.repository.TriagedIssueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class StaleIssueScheduler {

    private static final Logger log = LoggerFactory.getLogger(StaleIssueScheduler.class);

    private final TriagedIssueRepository triagedIssueRepository;
    private final RestClient restClient;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${rootcausex.stale-threshold-days:7}")
    private long staleThresholdDays;

    @Value("${rootcausex.alerts.webhook-url:}")
    private String alertWebhookUrl;

    @Value("${rootcausex.alerts.recipient-email:}")
    private String alertRecipientEmail;

    public StaleIssueScheduler(TriagedIssueRepository triagedIssueRepository, RestClient restClient) {
        this.triagedIssueRepository = triagedIssueRepository;
        this.restClient = restClient;
    }

    @Scheduled(cron = "${rootcausex.stale-cron:0 0 9 * * *}")
    public void runDailyStaleIssueCheck() {
        log.info("[CRON TRIGGER] Executing scheduled scan for stale unresolved CRITICAL & HIGH issues (> {} days old)...", staleThresholdDays);
        StaleCheckResponse report = checkStaleIssues();
        log.info("[CRON SUMMARY] Stale Scan Complete: Found {} critical/high stale issues needing escalation.", report.staleCriticalCount());
    }

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

        // Dispatch alerts if stale issues found
        if (!alerts.isEmpty()) {
            dispatchWebhookAlert(summary);
            dispatchEmailAlert(summary, alerts.size(), (int) criticalCount);
        }

        return new StaleCheckResponse(
            alerts.size(),
            (int) criticalCount,
            alerts,
            summary
        );
    }

    private void dispatchWebhookAlert(String summary) {
        if (alertWebhookUrl == null || alertWebhookUrl.isBlank()) {
            return;
        }
        try {
            restClient.post()
                .uri(alertWebhookUrl)
                .body(Map.of("text", "[RootCauseX SLA Alert] " + summary))
                .retrieve()
                .toBodilessEntity();
            log.info("Stale issue alert dispatched to webhook: {}", alertWebhookUrl);
        } catch (Exception e) {
            log.error("Failed to dispatch stale issue webhook alert to {}: {}", alertWebhookUrl, e.getMessage());
        }
    }

    private void dispatchEmailAlert(String summary, int totalCount, int criticalCount) {
        if (mailSender == null || alertRecipientEmail == null || alertRecipientEmail.isBlank()) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(alertRecipientEmail);
            message.setSubject("[RootCauseX] Stale Issue SLA Escalation — " + totalCount + " issues require attention");
            message.setText(
                "RootCauseX SLA Monitor Alert\n\n" +
                summary + "\n\n" +
                "Critical issues: " + criticalCount + "\n" +
                "Total stale: " + totalCount + "\n\n" +
                "Please review and resolve these issues immediately to meet SLA requirements.\n\n" +
                "— RootCauseX Automated Alert System"
            );
            mailSender.send(message);
            log.info("Stale issue alert email sent to: {}", alertRecipientEmail);
        } catch (Exception e) {
            log.error("Failed to send stale issue alert email to {}: {}", alertRecipientEmail, e.getMessage());
        }
    }
}
