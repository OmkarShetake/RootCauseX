package com.rootcausex.controller;

import com.rootcausex.dto.CodePatchResponse;
import com.rootcausex.service.CodePatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/repos")
public class PatchController {

    private final CodePatchService codePatchService;

    public PatchController(CodePatchService codePatchService) {
        this.codePatchService = codePatchService;
    }

    /**
     * Generates an AI-powered code patch for a triaged issue.
     * Result is cached in Redis for 24 hours.
     *
     * POST /api/v1/repos/{owner}/{repo}/issues/{issueNumber}/generate-patch
     */
    @PostMapping("/{owner}/{repo}/issues/{issueNumber}/generate-patch")
    public ResponseEntity<CodePatchResponse> generatePatch(
        @PathVariable String owner,
        @PathVariable String repo,
        @PathVariable int issueNumber
    ) {
        CodePatchResponse response = codePatchService.generatePatch(owner, repo, issueNumber);
        return ResponseEntity.ok(response);
    }
}
