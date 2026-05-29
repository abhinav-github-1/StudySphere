package com.collaborative.studyroom.dto;

import com.collaborative.studyroom.model.User;
import java.time.LocalDateTime;
import java.util.List;

/**
 * SessionResponse - payload returned to represent a study session.
 */
public class SessionResponse {

    private String id;
    private String roomId;
    private String roomName;
    private String startedBy;
    private String startedByName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long durationInSeconds;
    private String status;
    private List<User> participants;
    private LocalDateTime createdAt;

    public SessionResponse() {}

    public SessionResponse(String id, String roomId, String roomName, String startedBy, String startedByName,
                           LocalDateTime startTime, LocalDateTime endTime, long durationInSeconds,
                           String status, List<User> participants, LocalDateTime createdAt) {
        this.id = id;
        this.roomId = roomId;
        this.roomName = roomName;
        this.startedBy = startedBy;
        this.startedByName = startedByName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationInSeconds = durationInSeconds;
        this.status = status;
        this.participants = participants;
        this.createdAt = createdAt;
    }

    // Getters and Setters
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
