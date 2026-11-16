package com.rootcausex.security;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class GitHubWebhookSignatureVerifier {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    /**
     * Verifies a GitHub webhook X-Hub-Signature-256 header.
     * Uses constant-time comparison (MessageDigest.isEqual) to prevent timing attacks.
     *
     * @param secret          the GITHUB_WEBHOOK_SECRET value
     * @param body            the raw request body bytes
     * @param signatureHeader the value of X-Hub-Signature-256 (e.g. "sha256=abc123...")
     * @return true if the computed HMAC matches the header; false otherwise
     */
    public boolean verify(String secret, byte[] body, String signatureHeader) {
        if (secret == null || secret.isBlank()) {
            return false;
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] computed = mac.doFinal(body);
            String expectedSignature = "sha256=" + hexEncode(computed);
            return MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                signatureHeader.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    private String hexEncode(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
