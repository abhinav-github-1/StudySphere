package com.collaborative.studyroom.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * RoomInvitation - represents a study room invitation in MongoDB.
 * Indexed on roomId, receiverId, and receiverEmail for fast workspace querying.
 */
@Document(collection = "room_invitations")
public class RoomInvitation {

    @Id
    private String id;

    @Indexed
    private String roomId;
    private String roomName;

    private String senderId;
    private String senderName;

    @Indexed
    private String receiverId;

    @Indexed
    private String receiverEmail;

    private String status; // PENDING, ACCEPTED, REJECTED

    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

    // Constructors
    public RoomInvitation() {
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    public RoomInvitation(String roomId, String roomName, String senderId, String senderName, String receiverEmail) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.senderId = senderId;
        this.senderName = senderName;
        this.receiverEmail = receiverEmail;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
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
