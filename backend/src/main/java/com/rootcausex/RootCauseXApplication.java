package com.rootcausex;

import org.springframework.ai.autoconfigure.vectorstore.pgvector.PgVectorStoreAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {
    PgVectorStoreAutoConfiguration.class
})
@EnableScheduling
@EnableAsync
public class RootCauseXApplication {

    public static void main(String[] args) {
        SpringApplication.run(RootCauseXApplication.class, args);
    }
}
