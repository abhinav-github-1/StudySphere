package com.collaborative.studyroom.controller;

import com.collaborative.studyroom.model.ChatMessage;
import com.collaborative.studyroom.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ChatController — REST endpoints for chat history.
 *
 * Note: Real-time message sending is handled by the Socket.IO server (not REST).
 * This controller only serves the persistent chat history on page load.
 *
 * Base URL: /api/chat
 * All routes require JWT authentication.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController extends BaseController {

    @Autowired
    private ChatService chatService;

    /**
     * GET /api/chat/history/{roomId}
     *
     * Returns the last 50 messages for a room in chronological order.
     * Only participants of the room can access this endpoint.
     *
     * @param roomId  The study room ID (path variable)
     * @return List of ChatMessage objects
     */
    @GetMapping("/history/{roomId}")
    public ResponseEntity<?> getChatHistory(@PathVariable String roomId) {
        try {
            String userEmail = getAuthenticatedEmail();
            List<ChatMessage> history = chatService.getRoomHistory(roomId, userEmail);
            return ResponseEntity.ok(history);
        } catch (RuntimeException e) {
            // Return 403 if user is not a participant, 404 if room not found
            HttpStatus status = e.getMessage().contains("not found")
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.FORBIDDEN;
            return ResponseEntity.status(status)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
