package com.rootcausex.dto;

import java.util.List;

public record StaleCheckResponse(
    int checkedCount,
    int staleCriticalCount,
    List<StaleIssueAlert> alerts,
    String summary
) {}
