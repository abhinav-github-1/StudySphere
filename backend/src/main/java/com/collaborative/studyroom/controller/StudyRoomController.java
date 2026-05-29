package com.collaborative.studyroom.controller;

import com.collaborative.studyroom.dto.CreateRoomRequest;
import com.collaborative.studyroom.dto.RoomResponse;
import com.collaborative.studyroom.service.StudyRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * StudyRoomController - REST API endpoints for managing study rooms.
 *
 * All routes except GET /api/rooms are protected by JWT authentication.
 * The authenticated user's email is extracted from Spring Security context.
 */
@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:5173")
public class StudyRoomController extends BaseController {

    @Autowired
    private StudyRoomService studyRoomService;

    // ─── GET /api/rooms ───────────────────────────────────────────────────────
    /**
     * Returns all currently active study rooms.
     * Accessible to authenticated users; used for the discovery/browse page.
     */
    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        List<RoomResponse> rooms = studyRoomService.getAllActiveRooms();
        return ResponseEntity.ok(rooms);
    }

    // ─── GET /api/rooms/{roomId} ──────────────────────────────────────────────
    /**
     * Returns detailed info about a single room.
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoomById(@PathVariable String roomId) {
        try {
            RoomResponse room = studyRoomService.getRoomById(roomId);
            return ResponseEntity.ok(room);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── GET /api/rooms/my ────────────────────────────────────────────────────
    /**
     * Returns rooms where the current user is a participant.
     */
    @GetMapping("/my")
    public ResponseEntity<List<RoomResponse>> getMyRooms() {
        String email = getAuthenticatedEmail();
        List<RoomResponse> rooms = studyRoomService.getMyRooms(email);
        return ResponseEntity.ok(rooms);
    }

    // ─── GET /api/rooms/created ───────────────────────────────────────────────
    /**
     * Returns rooms created by the current user.
     */
    @GetMapping("/created")
    public ResponseEntity<List<RoomResponse>> getCreatedRooms() {
        String email = getAuthenticatedEmail();
        List<RoomResponse> rooms = studyRoomService.getCreatedRooms(email);
        return ResponseEntity.ok(rooms);
    }

    // ─── POST /api/rooms ──────────────────────────────────────────────────────
    /**
     * Creates a new study room. The authenticated user becomes the creator.
     */
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody CreateRoomRequest request) {
        try {
            String email = getAuthenticatedEmail();
            RoomResponse room = studyRoomService.createRoom(request, email);
            return ResponseEntity.status(HttpStatus.CREATED).body(room);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── POST /api/rooms/{roomId}/join ────────────────────────────────────────
    /**
     * Joins the authenticated user to the specified room.
     */
    @PostMapping("/{roomId}/join")
    public ResponseEntity<?> joinRoom(@PathVariable String roomId) {
        try {
            String email = getAuthenticatedEmail();
            RoomResponse room = studyRoomService.joinRoom(roomId, email);
            return ResponseEntity.ok(room);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── POST /api/rooms/{roomId}/leave ───────────────────────────────────────
    /**
     * Removes the authenticated user from the specified room.
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable String roomId) {
        try {
            String email = getAuthenticatedEmail();
            RoomResponse room = studyRoomService.leaveRoom(roomId, email);
            return ResponseEntity.ok(room);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ─── DELETE /api/rooms/{roomId} ───────────────────────────────────────────
    /**
     * Soft-deletes a room (marks inactive). Only the creator can delete.
     */
    @DeleteMapping("/{roomId}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomId) {
        try {
            String email = getAuthenticatedEmail();
            studyRoomService.deleteRoom(roomId, email);
            return ResponseEntity.ok(Map.of("message", "Room deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
