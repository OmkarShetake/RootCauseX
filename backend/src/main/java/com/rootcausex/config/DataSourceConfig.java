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
        // Attempt connecting to PostgreSQL
        try {
            log.info("Testing connection to PostgreSQL at {}", pgUrl);
            DriverManager.setLoginTimeout(2);
            try (Connection testConn = DriverManager.getConnection(pgUrl, pgUser, pgPassword)) {
                log.info("Successfully connected to PostgreSQL! Using production PostgreSQL DataSource.");
                HikariConfig config = new HikariConfig();
                config.setJdbcUrl(pgUrl);
                config.setUsername(pgUser);
                config.setPassword(pgPassword);
                config.setDriverClassName("org.postgresql.Driver");
                config.setMaximumPoolSize(20);
                config.setMinimumIdle(5);
                config.setConnectionTimeout(3000);
                return new HikariDataSource(config);
            }
        } catch (Exception e) {
            log.warn("PostgreSQL not detected or unreachable ({}). Initializing resilient in-memory H2 database (PostgreSQL mode).", e.getMessage());
            HikariConfig h2Config = new HikariConfig();
            h2Config.setJdbcUrl("jdbc:h2:mem:rootcausex;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH");
            h2Config.setUsername("sa");
            h2Config.setPassword("");
            h2Config.setDriverClassName("org.h2.Driver");
            h2Config.setMaximumPoolSize(10);
            return new HikariDataSource(h2Config);
        }
    }
}
