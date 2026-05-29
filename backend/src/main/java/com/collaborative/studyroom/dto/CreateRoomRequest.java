package com.collaborative.studyroom.dto;

/**
 * DTO for creating a new study room.
 */
public class CreateRoomRequest {
    private String roomName;
    private String description;
    private String subject;       // e.g., "Computer Science", "Mathematics"

    // ─── Constructors ──────────────────────────────────────────────────────────
    public CreateRoomRequest() {}

    public CreateRoomRequest(String roomName, String description, String subject) {
        this.roomName = roomName;
        this.description = description;
        this.subject = subject;
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
}
