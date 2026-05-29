package com.collaborative.studyroom.dto;

/**
 * DTO for joining a study room - currently just carries the roomId.
 * Kept as a DTO to allow future extension (e.g., join codes).
 */
public class JoinRoomRequest {
    private String roomId;

    // ─── Constructors ──────────────────────────────────────────────────────────
    public JoinRoomRequest() {}

    public JoinRoomRequest(String roomId) {
        this.roomId = roomId;
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }
}
