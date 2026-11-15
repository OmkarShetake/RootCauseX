package com.rootcausex.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/rootcausex}")
    private String pgUrl;

    @Value("${spring.datasource.username:rootcausex}")
    private String pgUser;

    @Value("${spring.datasource.password:rootcausex_password}")
    private String pgPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String effectiveUrl = pgUrl.trim();

        // Support direct copy-paste from Neon DB (e.g. postgresql://user:pass@ep-xyz.neon.tech/neondb)
        if (effectiveUrl.startsWith("postgres://")) {
            effectiveUrl = "jdbc:postgresql://" + effectiveUrl.substring("postgres://".length());
        } else if (effectiveUrl.startsWith("postgresql://")) {
            effectiveUrl = "jdbc:postgresql://" + effectiveUrl.substring("postgresql://".length());
        }

        // Ensure SSL mode for remote cloud databases like Neon
        if (effectiveUrl.contains("neon.tech") && !effectiveUrl.contains("sslmode=")) {
            effectiveUrl += (effectiveUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }

        log.info("Attempting connection to PostgreSQL/Neon database: {}", sanitizeUrl(effectiveUrl));

        try {
            // Generous timeout (10s) for Neon Serverless cold starts
            DriverManager.setLoginTimeout(10);
            try (Connection testConn = DriverManager.getConnection(effectiveUrl, pgUser, pgPassword)) {
                log.info("Successfully connected to PostgreSQL/Neon database! Using production HikariDataSource.");
                HikariConfig config = new HikariConfig();
                config.setJdbcUrl(effectiveUrl);
                config.setUsername(pgUser);
                config.setPassword(pgPassword);
                config.setDriverClassName("org.postgresql.Driver");
                config.setMaximumPoolSize(15);
                config.setMinimumIdle(2);
                config.setConnectionTimeout(10000);
                config.setIdleTimeout(300000);
                config.setMaxLifetime(600000);
                return new HikariDataSource(config);
            }
        } catch (Exception e) {
            log.warn("PostgreSQL/Neon could not be reached ({}). Initializing resilient in-memory H2 database (PostgreSQL mode).", e.getMessage());
            HikariConfig h2Config = new HikariConfig();
            h2Config.setJdbcUrl("jdbc:h2:mem:rootcausex;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH");
            h2Config.setUsername("sa");
            h2Config.setPassword("");
            h2Config.setDriverClassName("org.h2.Driver");
            h2Config.setMaximumPoolSize(10);
            return new HikariDataSource(h2Config);
        }
    }

    private String sanitizeUrl(String url) {
        return url.replaceAll(":[^:@]+@", ":****@");
    }
}
