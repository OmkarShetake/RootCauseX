package com.rootcausex.controller;

import com.rootcausex.dto.KnowledgeSyncRequest;
import com.rootcausex.dto.KnowledgeSyncResponse;
import com.rootcausex.service.KnowledgeSyncService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/repos")
public class SyncController {

    private final KnowledgeSyncService knowledgeSyncService;

    public SyncController(KnowledgeSyncService knowledgeSyncService) {
        this.knowledgeSyncService = knowledgeSyncService;
    }

    @PostMapping("/sync")
    public ResponseEntity<KnowledgeSyncResponse> syncRepositoryKnowledge(
        @Valid @RequestBody KnowledgeSyncRequest request
    ) {
        KnowledgeSyncResponse response = knowledgeSyncService.syncClosedIssues(request);
        return ResponseEntity.ok(response);
    }
}
