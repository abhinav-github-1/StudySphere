package com.collaborative.studyroom.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "activity_logs")
public class ActivityLog {

    @Id
    private String id;
    
    private String userId;
    private String roomId;
    private String actionType;
    
    private LocalDateTime timestamp;
    private String details;

    // Constructors
    public ActivityLog() {
        this.timestamp = LocalDateTime.now();
    }

    public ActivityLog(String id, String userId, String roomId, String actionType, LocalDateTime timestamp, String details) {
        this.id = id;
        this.userId = userId;
        this.roomId = roomId;
        this.actionType = actionType;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
        this.details = details;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
