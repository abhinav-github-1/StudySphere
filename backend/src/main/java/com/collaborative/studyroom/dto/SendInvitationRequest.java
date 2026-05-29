package com.collaborative.studyroom.dto;

/**
 * SendInvitationRequest - payload mapping for sending a room invitation.
 */
public class SendInvitationRequest {

    private String roomId;
    private String receiverEmail;

    public SendInvitationRequest() {}

    public SendInvitationRequest(String roomId, String receiverEmail) {
        this.roomId = roomId;
        this.receiverEmail = receiverEmail;
    }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getReceiverEmail() { return receiverEmail; }
    public void setReceiverEmail(String receiverEmail) { this.receiverEmail = receiverEmail; }
}
