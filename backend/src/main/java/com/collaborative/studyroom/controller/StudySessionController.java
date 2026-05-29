package com.collaborative.studyroom.controller;

import com.collaborative.studyroom.dto.EndSessionResponse;
import com.collaborative.studyroom.dto.SessionResponse;
import com.collaborative.studyroom.service.StudySessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * StudySessionController — REST API endpoints for starting, concluding,
 * and fetching collaborative study sessions.
 */
@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "http://localhost:5173")
public class StudySessionController extends BaseController {

    @Autowired
    private StudySessionService studySessionService;

    /**
     * POST /api/sessions/start/{roomId}
     * Starts a new study session inside the specified room.
     */
    @PostMapping("/start/{roomId}")
    public ResponseEntity<?> startSession(@PathVariable String roomId) {
        try {
            String userEmail = getAuthenticatedEmail();
            SessionResponse response = studySessionService.startSession(roomId, userEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/sessions/end/{sessionId}
     * Concludes a running study session and calculates duration.
     */
    @PostMapping("/end/{sessionId}")
    public ResponseEntity<?> endSession(@PathVariable String sessionId) {
        try {
            String userEmail = getAuthenticatedEmail();
            EndSessionResponse response = studySessionService.endSession(sessionId, userEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/sessions/room/{roomId}
     * Retrieves the current active session in the specified room, if any.
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getActiveSession(@PathVariable String roomId) {
        try {
            SessionResponse response = studySessionService.getActiveSessionForRoom(roomId);
            if (response == null) {
                return ResponseEntity.ok().body(Map.of("active", false));
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/sessions/history/{roomId}
     * Fetches completed session histories inside a specific study room.
     */
    @GetMapping("/history/{roomId}")
    public ResponseEntity<?> getRoomHistory(@PathVariable String roomId) {
        try {
            List<SessionResponse> history = studySessionService.getRoomSessionHistory(roomId);
            return ResponseEntity.ok(history);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/sessions/my-history
     * Retrieves individual session tracking logs for the logged-in user.
     */
    @GetMapping("/my-history")
    public ResponseEntity<?> getMyHistory() {
        try {
            String userEmail = getAuthenticatedEmail();
            List<SessionResponse> history = studySessionService.getUserSessionHistory(userEmail);
            return ResponseEntity.ok(history);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
