package com.rootcausex.controller;

import com.rootcausex.dto.AskRepoRequest;
import com.rootcausex.dto.AskRepoResponse;
import com.rootcausex.service.RepoChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/repos")
public class AskRepoController {

    private final RepoChatService repoChatService;

    public AskRepoController(RepoChatService repoChatService) {
        this.repoChatService = repoChatService;
    }

    @PostMapping("/{owner}/{repo}/ask")
    public ResponseEntity<AskRepoResponse> askRepository(
        @PathVariable String owner,
        @PathVariable String repo,
        @Valid @RequestBody AskRepoRequest request
    ) {
        AskRepoResponse response = repoChatService.askRepository(owner, repo, request);
        return ResponseEntity.ok(response);
    }
}
