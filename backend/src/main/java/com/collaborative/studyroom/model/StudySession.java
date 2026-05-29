package com.collaborative.studyroom.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * StudySession - represents a collaborative study session persisted in MongoDB.
 * Keeps track of session duration, started user, participants, and completion status.
 */
@Document(collection = "study_sessions")
public class StudySession {

    @Id
    private String id;

    @Indexed
    private String roomId;

    private String roomName;

    @Indexed
    private String startedBy;       // email of user who started the session
    private String startedByName;   // full name of user who started the session

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private long durationInSeconds; // calculated when session completes

    @Indexed
    private String status;          // ACTIVE, COMPLETED

    private List<User> participants = new ArrayList<>();

    private LocalDateTime createdAt;

    // ─── Constructors ──────────────────────────────────────────────────────────
    public StudySession() {
        this.status = "ACTIVE";
        this.startTime = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public StudySession(String roomId, String roomName, String startedBy, String startedByName) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.startedBy = startedBy;
        this.startedByName = startedByName;
        this.status = "ACTIVE";
        this.startTime = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.participants = new ArrayList<>();
    }

    // ─── Getters and Setters ──────────────────────────────────────────────────
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getStartedBy() { return startedBy; }
    public void setStartedBy(String startedBy) { this.startedBy = startedBy; }

    public String getStartedByName() { return startedByName; }
    public void setStartedByName(String startedByName) { this.startedByName = startedByName; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public long getDurationInSeconds() { return durationInSeconds; }
    public void setDurationInSeconds(long durationInSeconds) { this.durationInSeconds = durationInSeconds; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<User> getParticipants() { return participants; }
    public void setParticipants(List<User> participants) { this.participants = participants; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
