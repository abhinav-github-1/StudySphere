package com.collaborative.studyroom.service;

import com.collaborative.studyroom.model.ChatMessage;
import com.collaborative.studyroom.model.StudyRoom;
import com.collaborative.studyroom.repository.ChatMessageRepository;
import com.collaborative.studyroom.repository.StudyRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * ChatService — business logic for chat message persistence and validation.
 *
 * Responsibilities:
 *  - Save new messages to MongoDB
 *  - Retrieve room chat history
 *  - Validate that a user is a participant before allowing history access
 */
@Service
public class ChatService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private StudyRoomRepository studyRoomRepository;

    // ─── Save Message ─────────────────────────────────────────────────────────

    /**
     * Persists a chat message to MongoDB.
     *
     * @param message The ChatMessage object (roomId, sender info, text must be set)
     * @return The saved ChatMessage with generated ID and timestamp
     */
    public ChatMessage saveMessage(ChatMessage message) {
        // Sanitize input — strip dangerous HTML characters
        if (message.getMessage() != null) {
            message.setMessage(sanitize(message.getMessage()));
        }
        return chatMessageRepository.save(message);
    }

    // ─── Get History ──────────────────────────────────────────────────────────

    /**
     * Returns the last 50 messages for a room, in ascending (oldest→newest) order.
     * Validates that the requesting user is a participant of the room.
     *
     * @param roomId    The study room ID
     * @param userEmail JWT-authenticated user's email
     * @return List of ChatMessage (oldest first, max 50)
     * @throws RuntimeException if room not found or user is not a participant
     */
    public List<ChatMessage> getRoomHistory(String roomId, String userEmail) {
        // Validate room exists
        StudyRoom room = studyRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));

        // Validate user is a participant
        boolean isParticipant = room.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equals(userEmail));

        if (!isParticipant) {
            throw new RuntimeException("Access denied: You are not a participant of this room.");
        }

        // Fetch last 50 messages (newest first from DB) then reverse for display order
        List<ChatMessage> messages = chatMessageRepository
                .findTop50ByRoomIdOrderByTimestampDesc(roomId);

        Collections.reverse(messages); // oldest → newest
        return messages;
    }

    // ─── Validate Participant ─────────────────────────────────────────────────

    /**
     * Checks if a user is a participant of a room. Used by the Socket.IO handler.
     *
     * @param roomId    The room ID
     * @param userEmail The user's email
     * @return true if the user is a participant, false otherwise
     */
    public boolean isParticipant(String roomId, String userEmail) {
        return studyRoomRepository.findById(roomId)
                .map(room -> room.getParticipants().stream()
                        .anyMatch(p -> p.getEmail().equals(userEmail)))
                .orElse(false);
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    /**
     * Basic message sanitization — removes common HTML injection characters.
     * For production, consider a library like OWASP AntiSamy or jsoup.
     */
    private String sanitize(String input) {
        return input
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;")
                .trim();
    }
}
