package com.collaborative.studyroom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StudyRoomApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudyRoomApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner validateMongoConnection(org.springframework.data.mongodb.core.MongoTemplate mongoTemplate) {
        return args -> {
            try {
                // Execute a simple ping command to check Atlas database connection
                org.bson.Document ping = new org.bson.Document("ping", 1);
                mongoTemplate.getDb().runCommand(ping);
                System.out.println("✅ MONGODB ATLAS CONNECTION SUCCESSFUL: Database is connected and verified!");
            } catch (Exception e) {
                System.err.println("❌ MONGODB ATLAS CONNECTION FAILED on startup! Check your connection string/whitelist.");
                e.printStackTrace();
            }
        };
    }
}
