package com.rootcausex.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.security.GitHubWebhookSignatureVerifier;
import com.rootcausex.service.IssueTriageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final GitHubWebhookSignatureVerifier signatureVerifier;
    private final IssueTriageService issueTriageService;
    private final ObjectMapper objectMapper;

    @Value("${rootcausex.webhook.secret:}")
    private String webhookSecret;

    public WebhookController(
        GitHubWebhookSignatureVerifier signatureVerifier,
        IssueTriageService issueTriageService,
        ObjectMapper objectMapper
    ) {
        this.signatureVerifier = signatureVerifier;
        this.issueTriageService = issueTriageService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/github", consumes = "application/json")
    public ResponseEntity<?> handleGitHubWebhook(
        @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
        @RequestHeader(value = "X-GitHub-Event", required = false) String eventType,
        @RequestBody byte[] rawBody
    ) {
        // 501 if secret not configured
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("GitHub webhook received but GITHUB_WEBHOOK_SECRET is not configured.");
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_IMPLEMENTED,
                "GitHub webhook secret is not configured. Set GITHUB_WEBHOOK_SECRET environment variable."
            );
            problem.setTitle("Webhook Not Configured");
            problem.setType(URI.create("https://rootcausex.dev/errors/webhook-not-configured"));
            problem.setProperty("timestamp", Instant.now());
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(problem);
        }

        // 401 if signature invalid
        if (!signatureVerifier.verify(webhookSecret, rawBody, signature)) {
            log.warn("GitHub webhook signature verification failed.");
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "X-Hub-Signature-256 header is missing or does not match the computed HMAC-SHA256 signature."
            );
            problem.setTitle("Invalid Webhook Signature");
            problem.setType(URI.create("https://rootcausex.dev/errors/invalid-webhook-signature"));
            problem.setProperty("timestamp", Instant.now());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
        }

        // 200 for non-issues events
        if (!"issues".equals(eventType)) {
            log.info("Ignoring non-issues GitHub event type: {}", eventType);
            return ResponseEntity.ok(Map.of("status", "ignored", "event", eventType != null ? eventType : "unknown"));
        }

        try {
            JsonNode payload = objectMapper.readTree(rawBody);
            String action = payload.path("action").asText("");

            if (!"opened".equals(action) && !"reopened".equals(action)) {
                log.info("Ignoring issues event with action: {}", action);
                return ResponseEntity.ok(Map.of("status", "ignored", "action", action));
            }

            String owner = payload.path("repository").path("owner").path("login").asText("");
            String repoName = payload.path("repository").path("name").asText("");
            int issueNumber = payload.path("issue").path("number").asInt(0);

            if (owner.isBlank() || repoName.isBlank() || issueNumber <= 0) {
                log.warn("Webhook payload missing required fields: owner={}, repo={}, issue={}", owner, repoName, issueNumber);
                return ResponseEntity.ok(Map.of("status", "ignored", "reason", "missing_payload_fields"));
            }

            log.info("Dispatching async triage for {}/{} issue #{} (action={})", owner, repoName, issueNumber, action);
            issueTriageService.triageIssueAsync(owner, repoName, issueNumber);

            return ResponseEntity.accepted().body(Map.of(
                "status", "accepted",
                "message", "Triage dispatched asynchronously for " + owner + "/" + repoName + " #" + issueNumber
            ));

        } catch (Exception e) {
            log.error("Failed to parse GitHub webhook payload: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("status", "ignored", "reason", "payload_parse_error"));
        }
    }
}
