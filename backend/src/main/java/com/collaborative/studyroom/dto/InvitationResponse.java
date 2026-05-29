package com.collaborative.studyroom.dto;

import java.time.LocalDateTime;

/**
 * InvitationResponse - DTO output representing room invitation details safely.
 */
public class InvitationResponse {

    private String id;
    private String roomId;
    private String roomName;
    private String senderId;
    private String senderName;
    private String receiverId;
    private String receiverEmail;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

    public InvitationResponse() {}

    public InvitationResponse(String id, String roomId, String roomName, String senderId, String senderName,
                              String receiverId, String receiverEmail, String status,
                              LocalDateTime createdAt, LocalDateTime respondedAt) {
        this.id = id;
        this.roomId = roomId;
        this.roomName = roomName;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverId = receiverId;
        this.receiverEmail = receiverEmail;
        this.status = status;
        this.createdAt = createdAt;
        this.respondedAt = respondedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getReceiverEmail() { return receiverEmail; }
    public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
}
