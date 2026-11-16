package com.rootcausex.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record CodePatchResponse(
    @JsonPropertyDescription("Path of the source file targeted by this patch (e.g. src/main/java/com/example/DatabaseConfig.java)")
    String targetFile,

    @JsonPropertyDescription("Human-readable explanation of the root cause and what the patch changes")
    String explanation,

    @JsonPropertyDescription("The original code snippet before the patch is applied")
    String originalSnippet,

    @JsonPropertyDescription("The patched code snippet after the fix is applied")
    String patchedSnippet,

    @JsonPropertyDescription("Unified diff format string showing the exact changes (--- a/... +++ b/... @@ ... @@)")
    String gitDiff
) {}
