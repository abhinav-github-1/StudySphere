package com.collaborative.studyroom.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * ChatMessage - persisted chat messages for each study room.
 * Indexed on roomId for fast per-room history queries.
 */
@Document(collection = "chat_messages")
public class ChatMessage {

    @Id
    private String id;

    @Indexed                  // fast room-based lookups
    private String roomId;

    private String senderId;
    private String senderName;
    private String senderEmail;

    private String message;

    private LocalDateTime timestamp;

    // ─── Constructors ──────────────────────────────────────────────────────────
    public ChatMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(String roomId, String senderId, String senderName,
                       String senderEmail, String message) {
        this.roomId = roomId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderEmail = senderEmail;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
