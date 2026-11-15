package com.rootcausex.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    private static final Logger log = LoggerFactory.getLogger(RestClientConfig.class);

    @Value("${rootcausex.github.api-url:https://api.github.com}")
    private String githubApiUrl;

    @Value("${rootcausex.github.token:}")
    private String githubToken;

    @Bean
    public RestClient githubRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));

        RestClient.Builder builder = RestClient.builder()
            .baseUrl(githubApiUrl)
            .requestFactory(requestFactory)
            .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github.v3+json")
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.USER_AGENT, "RootCauseX-GitHub-Triage-Engine/1.0");

        if (githubToken != null && !githubToken.trim().isEmpty()) {
            log.info("Configuring GitHub RestClient with authenticated Bearer token (5,000 req/hr rate limit)");
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + githubToken.trim());
        } else {
            log.warn("No GITHUB_TOKEN detected in environment. Operating in unauthenticated mode (60 req/hr rate limit)");
        }

        // Support dynamic X-GitHub-Token header from incoming web requests
        builder.requestInterceptor((request, body, execution) -> {
            try {
                org.springframework.web.context.request.RequestAttributes attribs = 
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (attribs instanceof org.springframework.web.context.request.ServletRequestAttributes servletAttribs) {
                    String customToken = servletAttribs.getRequest().getHeader("X-GitHub-Token");
                    if (customToken != null && !customToken.trim().isEmpty()) {
                        request.getHeaders().set(HttpHeaders.AUTHORIZATION, "Bearer " + customToken.trim());
                    }
                }
            } catch (Exception ignored) {}
            return execution.execute(request, body);
        });

        return builder.build();
    }
}
