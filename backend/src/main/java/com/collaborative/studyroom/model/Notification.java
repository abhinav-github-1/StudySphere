package com.collaborative.studyroom.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Notification - represents an in-app alert/notification persisted in MongoDB.
 * Indexed on userId (email) and isRead for real-time queries.
 */
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId; // maps to user's email address

    private String title;
    private String message;
    private String type; // INVITATION_RECEIVED, INVITATION_ACCEPTED, ROOM_JOINED, etc.

    @Indexed
    private boolean isRead;

    private LocalDateTime createdAt;

    // Constructors
    public Notification() {
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    public Notification(String userId, String title, String message, String type) {
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
