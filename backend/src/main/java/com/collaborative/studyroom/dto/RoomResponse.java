package com.collaborative.studyroom.dto;

import com.collaborative.studyroom.model.User;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for sending study room data to the frontend.
 * Avoids leaking internal model details (e.g., passwords).
 */
public class RoomResponse {

    private String id;
    private String roomName;
    private String description;
    private String subject;

    // Creator info (flattened for convenience)
    private String createdByFullName;
    private String createdByEmail;

    private int participantCount;
    private List<User> participants;

    private boolean isActive;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─── Constructors ──────────────────────────────────────────────────────────
    public RoomResponse() {}

    public RoomResponse(String id, String roomName, String description, String subject,
                        String createdByFullName, String createdByEmail,
                        int participantCount, List<User> participants,
                        boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.roomName = roomName;
        this.description = description;
        this.subject = subject;
        this.createdByFullName = createdByFullName;
        this.createdByEmail = createdByEmail;
        this.participantCount = participantCount;
        this.participants = participants;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getCreatedByFullName() { return createdByFullName; }
    public void setCreatedByFullName(String createdByFullName) { this.createdByFullName = createdByFullName; }

    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }

    public int getParticipantCount() { return participantCount; }
    public void setParticipantCount(int participantCount) { this.participantCount = participantCount; }

    public List<User> getParticipants() { return participants; }
    public void setParticipants(List<User> participants) { this.participants = participants; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
