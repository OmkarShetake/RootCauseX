package com.rootcausex.controller;

import com.rootcausex.dto.RepoAnalyticsResponse;
import com.rootcausex.service.RepoAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/repos")
public class AnalyticsController {

    private final RepoAnalyticsService repoAnalyticsService;

    public AnalyticsController(RepoAnalyticsService repoAnalyticsService) {
        this.repoAnalyticsService = repoAnalyticsService;
    }

    @GetMapping("/{owner}/{repo}/analytics")
    public ResponseEntity<RepoAnalyticsResponse> getRepositoryAnalytics(
        @PathVariable String owner,
        @PathVariable String repo
    ) {
        RepoAnalyticsResponse analytics = repoAnalyticsService.getAnalytics(owner, repo);
        return ResponseEntity.ok(analytics);
    }
}
