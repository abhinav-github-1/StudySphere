package com.collaborative.studyroom.dto;

import java.time.LocalDateTime;

/**
 * EndSessionResponse - payload returned when a study session concludes.
 */
public class EndSessionResponse {

    private String id;
    private String roomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long durationInSeconds;

    public EndSessionResponse() {}

    public EndSessionResponse(String id, String roomName, LocalDateTime startTime, LocalDateTime endTime, long durationInSeconds) {
        this.id = id;
        this.roomName = roomName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationInSeconds = durationInSeconds;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public long getDurationInSeconds() { return durationInSeconds; }
    public void setDurationInSeconds(long durationInSeconds) { this.durationInSeconds = durationInSeconds; }
}
