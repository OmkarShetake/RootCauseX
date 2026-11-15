package com.rootcausex.dto;

import java.util.List;
import java.util.Map;

public record RepoIntelligenceResponse(
    String repoFullName,
    int architecturalRiskScore,
    String riskLevel,
    List<ComponentHotspot> componentHotspots,
    List<DefectCluster> recurringDefectClusters,
    MetricsDocumentation metricsDocumentation
) {
    public record ComponentHotspot(
        String component,
        long issueCount,
        double percentage,
        String riskLevel,
        String topFailurePattern
    ) {}

    public record DefectCluster(
        String clusterName,
        String component,
        int issueCount,
        List<Integer> issueNumbers,
        String rootCausePattern,
        String recommendedResolution
    ) {}

    public record MetricsDocumentation(
        String triageEfficiencyFormula,
        String benchmarkStandard,
        Map<String, Object> measuredMetrics,
        Map<String, Object> estimatedImpact
    ) {}
}
