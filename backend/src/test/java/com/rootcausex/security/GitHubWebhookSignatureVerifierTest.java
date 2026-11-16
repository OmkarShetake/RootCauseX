package com.rootcausex.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class GitHubWebhookSignatureVerifierTest {

    private GitHubWebhookSignatureVerifier verifier;

    @BeforeEach
    void setUp() {
        verifier = new GitHubWebhookSignatureVerifier();
    }

    @Test
    @DisplayName("Should return true for a valid HMAC-SHA256 signature matching the payload")
    void verifyValidSignature_returnsTrue() throws Exception {
        String secret = "test-secret-key";
        byte[] body = "{\"action\":\"opened\",\"issue\":{\"number\":42}}".getBytes(StandardCharsets.UTF_8);

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] computed = mac.doFinal(body);
        StringBuilder sb = new StringBuilder("sha256=");
        for (byte b : computed) {
            sb.append(String.format("%02x", b));
        }
        String validSignature = sb.toString();

        assertThat(verifier.verify(secret, body, validSignature)).isTrue();
    }

    @Test
    @DisplayName("Should return false when body is tampered after signature was computed")
    void verifyTamperedBody_returnsFalse() throws Exception {
        String secret = "test-secret-key";
        byte[] originalBody = "{\"action\":\"opened\",\"issue\":{\"number\":42}}".getBytes(StandardCharsets.UTF_8);

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] computed = mac.doFinal(originalBody);
        StringBuilder sb = new StringBuilder("sha256=");
        for (byte b : computed) {
            sb.append(String.format("%02x", b));
        }
        String signature = sb.toString();

        // Tampered body — signature must NOT match
        byte[] tamperedBody = "{\"action\":\"deleted\",\"issue\":{\"number\":99}}".getBytes(StandardCharsets.UTF_8);

        assertThat(verifier.verify(secret, tamperedBody, signature)).isFalse();
    }

    @Test
    @DisplayName("Should return false without throwing when signature header is null")
    void verifyMissingHeader_returnsFalse() {
        String secret = "test-secret-key";
        byte[] body = "{}".getBytes(StandardCharsets.UTF_8);

        assertThat(verifier.verify(secret, body, null)).isFalse();
    }
}
