package com.collaborative.studyroom.controller;

import com.collaborative.studyroom.dto.InvitationResponse;
import com.collaborative.studyroom.dto.SendInvitationRequest;
import com.collaborative.studyroom.service.RoomInvitationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * RoomInvitationController — Exposes REST endpoints to manage room invitations.
 */
@RestController
@RequestMapping("/api/invitations")
@CrossOrigin(origins = "http://localhost:5173")
public class RoomInvitationController extends BaseController {

    @Autowired
    private RoomInvitationService roomInvitationService;

    /**
     * POST /api/invitations/send
     * Sends a new study group invitation to a peer.
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendInvitation(@RequestBody SendInvitationRequest request) {
        try {
            String senderEmail = getAuthenticatedEmail();
            InvitationResponse response = roomInvitationService.sendInvitation(request, senderEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/invitations/accept/{invitationId}
     * Accepts a pending study room invitation.
     */
    @PostMapping("/accept/{invitationId}")
    public ResponseEntity<?> acceptInvitation(@PathVariable String invitationId) {
        try {
            String receiverEmail = getAuthenticatedEmail();
            InvitationResponse response = roomInvitationService.acceptInvitation(invitationId, receiverEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/invitations/reject/{invitationId}
     * Rejects/Declines a pending study room invitation.
     */
    @PostMapping("/reject/{invitationId}")
    public ResponseEntity<?> rejectInvitation(@PathVariable String invitationId) {
        try {
            String receiverEmail = getAuthenticatedEmail();
            InvitationResponse response = roomInvitationService.rejectInvitation(invitationId, receiverEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/invitations/received
     * Returns all invitations received by the authenticated user.
     */
    @GetMapping("/received")
    public ResponseEntity<?> getReceivedInvitations() {
        try {
            String email = getAuthenticatedEmail();
            List<InvitationResponse> received = roomInvitationService.getReceivedInvitations(email);
            return ResponseEntity.ok(received);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/invitations/sent
     * Returns all invitations dispatched by the authenticated user.
     */
    @GetMapping("/sent")
    public ResponseEntity<?> getSentInvitations() {
        try {
            String email = getAuthenticatedEmail();
            List<InvitationResponse> sent = roomInvitationService.getSentInvitations(email);
            return ResponseEntity.ok(sent);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
