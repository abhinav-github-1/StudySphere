package com.collaborative.studyroom.service;

import com.collaborative.studyroom.dto.CreateRoomRequest;
import com.collaborative.studyroom.dto.RoomResponse;
import com.collaborative.studyroom.model.ActivityLog;
import com.collaborative.studyroom.model.StudyRoom;
import com.collaborative.studyroom.model.User;
import com.collaborative.studyroom.repository.ActivityLogRepository;
import com.collaborative.studyroom.repository.StudyRoomRepository;
import com.collaborative.studyroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * StudyRoomService - contains all business logic for managing study rooms.
 * Handles creation, retrieval, join, leave, and deletion operations.
 */
@Service
public class StudyRoomService {

    @Autowired
    private StudyRoomRepository studyRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    // ─── Create Room ──────────────────────────────────────────────────────────

    /**
     * Creates a new study room and sets the authenticated user as the creator.
     *
     * @param request  Room creation DTO
     * @param userEmail Email of the authenticated user (from JWT)
     * @return RoomResponse DTO
     */
    public RoomResponse createRoom(CreateRoomRequest request, String userEmail) {
        // Fetch the authenticated user from the database
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        // Build the StudyRoom entity
        StudyRoom room = new StudyRoom();
        room.setRoomName(request.getRoomName());
        room.setDescription(request.getDescription());
        room.setSubject(request.getSubject());
        room.setCreatedBy(creator);
        room.setActive(true);
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());

        // Creator automatically joins their own room
        room.getParticipants().add(creator);

        StudyRoom savedRoom = studyRoomRepository.save(room);

        // Log the activity
        logActivity(creator.getId(), savedRoom.getId(), "ROOM_CREATED",
                creator.getFullName() + " created room: " + savedRoom.getRoomName());

        return mapToResponse(savedRoom);
    }

    // ─── Get All Active Rooms ─────────────────────────────────────────────────

    /**
     * Returns all currently active study rooms.
     */
    public List<RoomResponse> getAllActiveRooms() {
        return studyRoomRepository.findByIsActiveTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Get Room by ID ───────────────────────────────────────────────────────

    /**
     * Returns detailed information about a single room by its ID.
     */
    public RoomResponse getRoomById(String roomId) {
        StudyRoom room = studyRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + roomId));
        return mapToResponse(room);
    }

    // ─── Get Rooms by User ────────────────────────────────────────────────────

    /**
     * Returns all rooms where the user is a participant.
     */
    public List<RoomResponse> getMyRooms(String userEmail) {
        return studyRoomRepository.findByParticipantEmail(userEmail)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns all rooms created by the user.
     */
    public List<RoomResponse> getCreatedRooms(String userEmail) {
        return studyRoomRepository.findByCreatedByEmail(userEmail)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Join Room ────────────────────────────────────────────────────────────

    /**
     * Adds the authenticated user to a room's participant list.
     * Prevents duplicate joins.
     */
    public RoomResponse joinRoom(String roomId, String userEmail) {
        StudyRoom room = studyRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));

        if (!room.isActive()) {
            throw new RuntimeException("Cannot join an inactive room.");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        // Check if user is already in the room
        boolean alreadyJoined = room.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equals(userEmail));

        if (!alreadyJoined) {
            room.getParticipants().add(user);
            room.setUpdatedAt(LocalDateTime.now());
            studyRoomRepository.save(room);

            // Log the join activity
            logActivity(user.getId(), room.getId(), "ROOM_JOINED",
                    user.getFullName() + " joined room: " + room.getRoomName());
        }

        return mapToResponse(room);
    }

    // ─── Leave Room ───────────────────────────────────────────────────────────

    /**
     * Removes the authenticated user from a room's participant list.
     */
    public RoomResponse leaveRoom(String roomId, String userEmail) {
        StudyRoom room = studyRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        // Remove user from participants
        room.setParticipants(
                room.getParticipants().stream()
                        .filter(p -> !p.getEmail().equals(userEmail))
                        .collect(Collectors.toList())
        );
        room.setUpdatedAt(LocalDateTime.now());
        studyRoomRepository.save(room);

        // Log the leave activity
        logActivity(user.getId(), room.getId(), "ROOM_LEFT",
                user.getFullName() + " left room: " + room.getRoomName());

        return mapToResponse(room);
    }

    // ─── Delete Room ──────────────────────────────────────────────────────────

    /**
     * Soft-deletes a room by marking it as inactive.
     * Only the creator can delete the room.
     */
    public void deleteRoom(String roomId, String userEmail) {
        StudyRoom room = studyRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));

        // Only the creator can delete the room
        if (!room.getCreatedBy().getEmail().equals(userEmail)) {
            throw new RuntimeException("Only the room creator can delete this room.");
        }

        room.setActive(false);
        room.setUpdatedAt(LocalDateTime.now());
        studyRoomRepository.save(room);

        // Log the delete activity
        logActivity(null, room.getId(), "ROOM_DELETED",
                "Room deleted: " + room.getRoomName());
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    /**
     * Maps a StudyRoom entity to a RoomResponse DTO (safe for API output).
     */
    private RoomResponse mapToResponse(StudyRoom room) {
        String creatorName = room.getCreatedBy() != null ? room.getCreatedBy().getFullName() : "Unknown";
        String creatorEmail = room.getCreatedBy() != null ? room.getCreatedBy().getEmail() : "";
        int count = room.getParticipants() != null ? room.getParticipants().size() : 0;

        return new RoomResponse(
                room.getId(),
                room.getRoomName(),
                room.getDescription(),
                room.getSubject(),
                creatorName,
                creatorEmail,
                count,
                room.getParticipants(),
                room.isActive(),
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }

    /**
     * Persists an activity log entry for audit/dashboard purposes.
     */
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
            // Non-critical - log failure should not break main flow
            System.err.println("Warning: Activity log could not be saved: " + e.getMessage());
        }
    }
}
