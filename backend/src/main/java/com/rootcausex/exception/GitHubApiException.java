package com.rootcausex.exception;

public class GitHubApiException extends RuntimeException {
    private final int statusCode;
    private final Long resetEpochSeconds;

    public GitHubApiException(String message, int statusCode) {
        this(message, statusCode, null);
    }

    public GitHubApiException(String message, int statusCode, Long resetEpochSeconds) {
        super(message);
        this.statusCode = statusCode;
        this.resetEpochSeconds = resetEpochSeconds;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public Long getResetEpochSeconds() {
        return resetEpochSeconds;
    }
}
