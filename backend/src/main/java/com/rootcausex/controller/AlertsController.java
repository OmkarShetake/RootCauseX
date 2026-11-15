package com.rootcausex.controller;

import com.rootcausex.dto.StaleCheckResponse;
import com.rootcausex.scheduler.StaleIssueScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertsController {

    private final StaleIssueScheduler staleIssueScheduler;

    public AlertsController(StaleIssueScheduler staleIssueScheduler) {
        this.staleIssueScheduler = staleIssueScheduler;
    }

    @PostMapping("/check-stale")
    public ResponseEntity<StaleCheckResponse> checkStaleIssues() {
        StaleCheckResponse response = staleIssueScheduler.checkStaleIssues();
        return ResponseEntity.ok(response);
    }
}
