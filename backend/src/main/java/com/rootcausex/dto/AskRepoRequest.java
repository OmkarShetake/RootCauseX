package com.rootcausex.dto;

import jakarta.validation.constraints.NotBlank;

public record AskRepoRequest(
    @NotBlank(message = "Question cannot be blank")
    String question
) {}
