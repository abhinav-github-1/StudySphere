package com.collaborative.studyroom.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * StudyRoom entity - represents a collaborative study room in MongoDB.
 */
@Document(collection = "study_rooms")
public class StudyRoom {

    @Id
    private String id;

    private String roomName;
    private String description;
    private String subject;       // e.g., "Computer Science", "Mathematics"

    // Embedded creator info (snapshot, not reference)
    private User createdBy;

    private List<User> participants = new ArrayList<>();

    private boolean isActive;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─── Default Constructor ──────────────────────────────────────────────────
    public StudyRoom() {
        this.isActive = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // ─── Full Constructor (used by service layer) ─────────────────────────────
    public StudyRoom(String id, String roomName, String description, String subject,
                     User createdBy, List<User> participants, boolean isActive,
                     LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.roomName = roomName;
        this.description = description;
        this.subject = subject;
        this.createdBy = createdBy;
        this.participants = participants != null ? participants : new ArrayList<>();
        this.isActive = isActive;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    // ─── Mock/Bootstrap Constructor (used for fallback data) ─────────────────
    public StudyRoom(String id, String roomName, String createdByName,
                     int ignoredParticipantCount, String subject, boolean isActive) {
        this.id = id;
        this.roomName = roomName;
        this.description = "Study room for " + subject;
        this.subject = subject;
        this.isActive = isActive;
        this.participants = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        // Build a lightweight User placeholder for the creator
        User creator = new User();
        creator.setFullName(createdByName);
        this.createdBy = creator;
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

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public List<User> getParticipants() { return participants; }
    public void setParticipants(List<User> participants) { this.participants = participants; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
