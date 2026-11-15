package com.rootcausex.controller;

import com.rootcausex.dto.TriagedIssueResponse;
import com.rootcausex.service.IssueTriageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/repos")
public class TriageController {

    private final IssueTriageService issueTriageService;

    public TriageController(IssueTriageService issueTriageService) {
        this.issueTriageService = issueTriageService;
    }

    @PostMapping("/{owner}/{repo}/triage")
    public ResponseEntity<List<TriagedIssueResponse>> triageRepository(
        @PathVariable String owner,
        @PathVariable String repo
    ) {
        List<TriagedIssueResponse> triagedIssues = issueTriageService.triageRepository(owner, repo);
        return ResponseEntity.ok(triagedIssues);
    }

    @PostMapping("/{owner}/{repo}/issues/{issueNumber}/triage")
    public ResponseEntity<TriagedIssueResponse> triageSingleIssue(
        @PathVariable String owner,
        @PathVariable String repo,
        @PathVariable int issueNumber
    ) {
        TriagedIssueResponse response = issueTriageService.triageIssue(owner, repo, issueNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{owner}/{repo}/issues")
    public ResponseEntity<List<TriagedIssueResponse>> getTriagedIssues(
        @PathVariable String owner,
        @PathVariable String repo,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String severity,
        @RequestParam(required = false) Boolean isDuplicate,
        @RequestParam(required = false) Boolean isGoodFirstIssue,
        @RequestParam(required = false) String search
    ) {
        List<TriagedIssueResponse> issues = issueTriageService.listTriagedIssues(
            owner, repo, category, severity, isDuplicate, isGoodFirstIssue, search
        );
        return ResponseEntity.ok(issues);
    }
}
