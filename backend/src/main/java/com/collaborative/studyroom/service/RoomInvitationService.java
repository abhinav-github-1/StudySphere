package com.collaborative.studyroom.service;

import com.collaborative.studyroom.dto.InvitationResponse;
import com.collaborative.studyroom.dto.SendInvitationRequest;
import com.collaborative.studyroom.exception.InvalidActionException;
import com.collaborative.studyroom.exception.ResourceNotFoundException;
import com.collaborative.studyroom.exception.UnauthorizedActionException;
import com.collaborative.studyroom.model.ActivityLog;
import com.collaborative.studyroom.model.RoomInvitation;
import com.collaborative.studyroom.model.StudyRoom;
import com.collaborative.studyroom.model.User;
import com.collaborative.studyroom.repository.ActivityLogRepository;
import com.collaborative.studyroom.repository.RoomInvitationRepository;
import com.collaborative.studyroom.repository.StudyRoomRepository;
import com.collaborative.studyroom.repository.UserRepository;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoomInvitationService {

    @Autowired
    private RoomInvitationRepository roomInvitationRepository;

    @Autowired
    private StudyRoomRepository studyRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private SocketIOServer socketIOServer;

    // --- Send Invitation ---

    /**
     * Creates and dispatches a room invitation to a peer, pushing alerts in real-time.
     */
    public InvitationResponse sendInvitation(SendInvitationRequest request, String senderEmail) {
        // Validate sender user exists
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found: " + senderEmail));

        // Validate room exists
        StudyRoom room = studyRoomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Study room not found: " + request.getRoomId()));

        // Security check: sender must be a participant of the room to invite others
        boolean isSenderParticipant = room.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equals(senderEmail));
        if (!isSenderParticipant) {
            throw new UnauthorizedActionException("Only members of this room can invite peers.");
        }

        // Validate receiver exists in system
        User receiver = userRepository.findByEmail(request.getReceiverEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not registered in platform: " + request.getReceiverEmail()));

        // Validate: cannot invite yourself
        if (receiver.getEmail().equalsIgnoreCase(senderEmail)) {
            throw new InvalidActionException("You cannot invite yourself to a study room.");
        }

        // Validate: prevent inviting existing room members
        boolean isReceiverMember = room.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equalsIgnoreCase(request.getReceiverEmail()));
        if (isReceiverMember) {
            throw new InvalidActionException("This user is already a member of this room.");
        }

        // Validate: prevent duplicate PENDING invitations
        Optional<RoomInvitation> existingPending = roomInvitationRepository
                .findByRoomIdAndReceiverEmailAndStatus(room.getId(), request.getReceiverEmail(), "PENDING");
        if (existingPending.isPresent()) {
            throw new InvalidActionException("An invitation to this room is already pending for this user.");
        }

        // Build invitation record
        RoomInvitation invitation = new RoomInvitation(
                room.getId(),
                room.getRoomName(),
                sender.getId(),
                sender.getFullName(),
                receiver.getEmail()
        );
        invitation.setReceiverId(receiver.getId());

        RoomInvitation saved = roomInvitationRepository.save(invitation);
        InvitationResponse response = mapToResponse(saved);

        // Spawn persistent notification for receiver
        notificationService.createNotification(
                receiver.getEmail(),
                "New Room Invitation",
                sender.getFullName() + " invited you to join study room: " + room.getRoomName(),
                "INVITATION_RECEIVED"
        );

        // Real-time socket delivery of the full invitation payload to receiver
        try {
            socketIOServer.getRoomOperations("user_" + receiver.getEmail())
                    .sendEvent("invitation_received", response);
        } catch (Exception e) {
            System.err.println("Warning: Socket push for invitation failed: " + e.getMessage());
        }

        // Log the activity
        logActivity(sender.getId(), room.getId(), "INVITATION_SENT",
                sender.getFullName() + " invited " + receiver.getFullName() + " to room: " + room.getRoomName());

        return response;
    }

    // --- Accept Invitation ---

    /**
     * Accepts a room invitation, updating membership, notifying the host, and pushing socket signals.
     */
    public InvitationResponse acceptInvitation(String invitationId, String receiverEmail) {
        RoomInvitation invitation = roomInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found: " + invitationId));

        if (!invitation.getReceiverEmail().equalsIgnoreCase(receiverEmail)) {
            throw new UnauthorizedActionException("You are not authorized to accept this invitation.");
        }

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new InvalidActionException("This invitation has already been resolved.");
        }

        // Fetch associated room and user
        StudyRoom room = studyRoomRepository.findById(invitation.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated study room no longer exists."));
        
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver user profile not found."));

        // Join user to room participants list
        boolean alreadyMember = room.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equalsIgnoreCase(receiverEmail));
        if (!alreadyMember) {
            room.getParticipants().add(receiver);
            room.setUpdatedAt(LocalDateTime.now());
            studyRoomRepository.save(room);
        }

        // Update invitation status
        invitation.setStatus("ACCEPTED");
        invitation.setRespondedAt(LocalDateTime.now());
        RoomInvitation accepted = roomInvitationRepository.save(invitation);
        InvitationResponse response = mapToResponse(accepted);

        // Notify original sender
        User senderUser = userRepository.findById(invitation.getSenderId()).orElse(null);
        if (senderUser != null) {
            notificationService.createNotification(
                    senderUser.getEmail(),
                    "Invitation Accepted",
                    receiver.getFullName() + " accepted your invitation to study room: " + invitation.getRoomName(),
                    "INVITATION_ACCEPTED"
            );

            // Socket push to sender
            try {
                socketIOServer.getRoomOperations("user_" + senderUser.getEmail())
                        .sendEvent("invitation_accepted", response);
            } catch (Exception e) {
                // non-critical socket issue
            }
        }

        // Log the activity
        logActivity(receiver.getId(), room.getId(), "ROOM_JOINED",
                receiver.getFullName() + " joined room via invitation: " + room.getRoomName());
        logActivity(receiver.getId(), room.getId(), "INVITATION_ACCEPTED",
                receiver.getFullName() + " accepted study invitation for: " + room.getRoomName());

        return response;
    }

    // --- Reject Invitation ---

    /**
     * Declines a study room invitation, logging logs and notifying the host.
     */
    public InvitationResponse rejectInvitation(String invitationId, String receiverEmail) {
        RoomInvitation invitation = roomInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found: " + invitationId));

        if (!invitation.getReceiverEmail().equalsIgnoreCase(receiverEmail)) {
            throw new UnauthorizedActionException("You are not authorized to reject this invitation.");
        }

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new InvalidActionException("This invitation has already been resolved.");
        }

        // Update invitation status
        invitation.setStatus("REJECTED");
        invitation.setRespondedAt(LocalDateTime.now());
        RoomInvitation rejected = roomInvitationRepository.save(invitation);
        InvitationResponse response = mapToResponse(rejected);

        // Fetch users
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver user profile not found."));
        User senderUser = userRepository.findById(invitation.getSenderId()).orElse(null);

        // Notify sender
        if (senderUser != null) {
            notificationService.createNotification(
                    senderUser.getEmail(),
                    "Invitation Declined",
                    receiver.getFullName() + " declined your invitation to study room: " + invitation.getRoomName(),
                    "INVITATION_REJECTED"
            );

            // Socket push to sender
            try {
                socketIOServer.getRoomOperations("user_" + senderUser.getEmail())
                        .sendEvent("invitation_rejected", response);
            } catch (Exception e) {
                // non-critical socket issue
            }
        }

        // Log the activity
        logActivity(receiver.getId(), invitation.getRoomId(), "INVITATION_REJECTED",
                receiver.getFullName() + " declined study invitation for: " + invitation.getRoomName());

        return response;
    }

    // --- Retrievals ---

    public List<InvitationResponse> getReceivedInvitations(String email) {
        return roomInvitationRepository.findByReceiverEmailOrderByCreatedAtDesc(email).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<InvitationResponse> getSentInvitations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found."));
        return roomInvitationRepository.findBySenderIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- Private Helpers ---

    private InvitationResponse mapToResponse(RoomInvitation invite) {
        return new InvitationResponse(
                invite.getId(),
                invite.getRoomId(),
                invite.getRoomName(),
                invite.getSenderId(),
                invite.getSenderName(),
                invite.getReceiverId(),
                invite.getReceiverEmail(),
                invite.getStatus(),
                invite.getCreatedAt(),
                invite.getRespondedAt()
        );
    }

    private void logActivity(String userId, String roomId, String actionType, String description) {
        try {
            ActivityLog log = new ActivityLog();
            log.setUserId(userId);
            log.setRoomId(roomId);
            log.setActionType(actionType);
            log.setDetails(description);
            log.setTimestamp(LocalDateTime.now());
            activityLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Warning: Invitation activity log could not be saved: " + e.getMessage());
        }
    }
}
