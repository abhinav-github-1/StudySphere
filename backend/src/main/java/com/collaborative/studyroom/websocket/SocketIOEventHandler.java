package com.collaborative.studyroom.websocket;

import com.collaborative.studyroom.model.ChatMessage;
import com.collaborative.studyroom.security.JwtService;
import com.collaborative.studyroom.service.ChatService;
import com.collaborative.studyroom.service.StudySessionService;
import com.collaborative.studyroom.dto.SessionResponse;
import com.collaborative.studyroom.dto.EndSessionResponse;
import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SocketIOEventHandler — handles all Socket.IO events and manages the server lifecycle.
 *
 * ─── Socket Events Handled ────────────────────────────────────────────────────
 *
 * CLIENT → SERVER (incoming):
 *   join_room     { roomId }           — user joins a study room channel
 *   leave_room    { roomId }           — user leaves a study room channel
 *   send_message  { roomId, message }  — user sends a chat message
 *   typing_start  { roomId }           — user started typing
 *   typing_stop   { roomId }           — user stopped typing
 *
 * SERVER → CLIENT (outgoing broadcasts):
 *   receive_message   { id, roomId, senderName, senderEmail, message, timestamp }
 *   user_joined       { roomId, userName, email }
 *   user_left         { roomId, userName, email }
 *   typing_indicator  { roomId, userName, typing }
 *   room_updated      { roomId }  — signals frontend to refresh room data
 *
 * ─── Security ─────────────────────────────────────────────────────────────────
 *   - JWT validated on connect (in SocketIOConfig)
 *   - join_room validates user is a room participant via ChatService
 *   - send_message validates sender is still a participant
 */
@Component
public class SocketIOEventHandler {

    private static final Logger log = LoggerFactory.getLogger(SocketIOEventHandler.class);

    @Autowired
    private SocketIOServer server;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ChatService chatService;

    @Autowired
    private StudySessionService studySessionService;

    /**
     * In-memory map: sessionId → userEmail.
     * Used to look up disconnected user's email without needing to re-parse JWT.
     * ConcurrentHashMap for thread safety.
     */
    private final Map<String, String> sessionEmailMap = new ConcurrentHashMap<>();

    /**
     * In-memory map: sessionId → userName.
     * Used for disconnect broadcasting.
     */
    private final Map<String, String> sessionNameMap = new ConcurrentHashMap<>();

    /**
     * In-memory map: sessionId → Set of room IDs the client is in.
     * Used to broadcast user_left to all rooms on disconnect.
     */
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @PostConstruct
    public void start() {
        registerEventHandlers();
        server.start();
        log.info("✅ Socket.IO server started on port {}", server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stop() {
        server.stop();
        log.info("🛑 Socket.IO server stopped.");
    }

    // ─── Event Registration ───────────────────────────────────────────────────

    /**
     * Registers all client event listeners.
     * Called once at startup.
     */
    private void registerEventHandlers() {

        // ── CONNECT ──────────────────────────────────────────────────────────
        server.addConnectListener(client -> {
            String token = client.getHandshakeData().getSingleUrlParam("token");
            try {
                String email = jwtService.extractEmail(token);
                // Store email for later use (e.g., on disconnect, on message)
                sessionEmailMap.put(client.getSessionId().toString(), email);
                
                // Join their personal private socket room for targeted real-time alerts
                client.joinRoom("user_" + email);
                
                log.info("Client connected: {} (session: {})", email, client.getSessionId());
            } catch (Exception e) {
                log.warn("Connect rejected — invalid token");
                client.disconnect();
            }
        });

        // ── DISCONNECT ───────────────────────────────────────────────────────
        server.addDisconnectListener(client -> {
            String sessionId = client.getSessionId().toString();
            String email = sessionEmailMap.remove(sessionId);
            String name  = sessionNameMap.remove(sessionId);
            String roomId = sessionRoomMap.remove(sessionId);

            if (roomId != null && email != null) {
                // Broadcast user_left to the room they were in
                server.getRoomOperations(roomId).sendEvent("user_left",
                        Map.of("roomId", roomId, "userName", name != null ? name : email, "email", email));
                server.getRoomOperations(roomId).sendEvent("room_updated", Map.of("roomId", roomId));
                log.info("User disconnected from room {}: {}", roomId, email);
            }
        });

        // ── join_room { roomId } ─────────────────────────────────────────────
        server.addEventListener("join_room", JoinRoomPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    String name  = data.getUserName() != null ? data.getUserName() : email;

                    if (email == null) { client.disconnect(); return; }

                    // Validate the user is a participant (security check)
                    if (!chatService.isParticipant(data.getRoomId(), email)) {
                        client.sendEvent("error", Map.of("message", "You are not a participant of this room."));
                        return;
                    }

                    // Add client to Netty's room channel (for room-based broadcasting)
                    client.joinRoom(data.getRoomId());

                    // Store room mapping for disconnect cleanup
                    sessionNameMap.put(client.getSessionId().toString(), name);
                    sessionRoomMap.put(client.getSessionId().toString(), data.getRoomId());

                    // Broadcast to ALL in the room (including the joining user)
                    server.getRoomOperations(data.getRoomId()).sendEvent("user_joined",
                            Map.of("roomId", data.getRoomId(), "userName", name, "email", email));

                    // Signal room data refresh (participant count update)
                    server.getRoomOperations(data.getRoomId()).sendEvent("room_updated",
                            Map.of("roomId", data.getRoomId()));

                    log.info("User {} joined room {}", email, data.getRoomId());
                });

        // ── leave_room { roomId } ────────────────────────────────────────────
        server.addEventListener("leave_room", LeaveRoomPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    String name  = sessionNameMap.getOrDefault(client.getSessionId().toString(), email);

                    client.leaveRoom(data.getRoomId());
                    sessionRoomMap.remove(client.getSessionId().toString());

                    server.getRoomOperations(data.getRoomId()).sendEvent("user_left",
                            Map.of("roomId", data.getRoomId(), "userName", name != null ? name : email, "email", email != null ? email : ""));
                    server.getRoomOperations(data.getRoomId()).sendEvent("room_updated",
                            Map.of("roomId", data.getRoomId()));

                    log.info("User {} left room {}", email, data.getRoomId());
                });

        // ── send_message { roomId, message, senderName } ─────────────────────
        server.addEventListener("send_message", SendMessagePayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    if (email == null) { client.disconnect(); return; }

                    // Security: re-validate participation before saving message
                    if (!chatService.isParticipant(data.getRoomId(), email)) {
                        client.sendEvent("error", Map.of("message", "Cannot send message: not a participant."));
                        return;
                    }

                    if (data.getMessage() == null || data.getMessage().isBlank()) return;

                    // Build and persist the message to MongoDB
                    ChatMessage msg = new ChatMessage();
                    msg.setRoomId(data.getRoomId());
                    msg.setSenderEmail(email);
                    msg.setSenderName(data.getSenderName() != null ? data.getSenderName() : email);
                    msg.setMessage(data.getMessage());
                    msg.setTimestamp(LocalDateTime.now());
                    ChatMessage saved = chatService.saveMessage(msg);

                    // Broadcast to ALL in the room
                    server.getRoomOperations(data.getRoomId()).sendEvent("receive_message",
                            Map.of(
                                "id",          saved.getId() != null ? saved.getId() : "",
                                "roomId",      saved.getRoomId(),
                                "senderName",  saved.getSenderName(),
                                "senderEmail", saved.getSenderEmail(),
                                "message",     saved.getMessage(),
                                "timestamp",   saved.getTimestamp().toString()
                            ));

                    log.debug("Message in room {} from {}: {}", data.getRoomId(), email, data.getMessage());
                });

        // ── typing_start { roomId, userName } ───────────────────────────────
        server.addEventListener("typing_start", TypingPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    // Broadcast to OTHERS in the room (not sender)
                    client.getNamespace().getRoomOperations(data.getRoomId())
                          .sendEvent("typing_indicator",
                                  client,  // exclude sender
                                  Map.of("roomId", data.getRoomId(),
                                         "userName", data.getUserName() != null ? data.getUserName() : email,
                                         "typing", true));
                });

        // ── typing_stop { roomId, userName } ────────────────────────────────
        server.addEventListener("typing_stop", TypingPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    client.getNamespace().getRoomOperations(data.getRoomId())
                          .sendEvent("typing_indicator",
                                  client,  // exclude sender
                                  Map.of("roomId", data.getRoomId(),
                                         "userName", data.getUserName() != null ? data.getUserName() : email,
                                         "typing", false));
                });

        // ── start_session { roomId, userName } ────────────────────────────────
        server.addEventListener("start_session", JoinRoomPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    if (email == null) { client.disconnect(); return; }
                    try {
                        SessionResponse response = studySessionService.startSession(data.getRoomId(), email);
                        server.getRoomOperations(data.getRoomId()).sendEvent("session_started", response);
                        server.getRoomOperations(data.getRoomId()).sendEvent("room_updated", Map.of("roomId", data.getRoomId()));
                        log.info("Session started in room {} by {}", data.getRoomId(), email);
                    } catch (Exception e) {
                        client.sendEvent("error", Map.of("message", e.getMessage()));
                    }
                });

        // ── end_session { roomId, userName } ──────────────────────────────────
        server.addEventListener("end_session", JoinRoomPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    if (email == null) { client.disconnect(); return; }
                    try {
                        SessionResponse active = studySessionService.getActiveSessionForRoom(data.getRoomId());
                        if (active != null) {
                            EndSessionResponse response = studySessionService.endSession(active.getId(), email);
                            server.getRoomOperations(data.getRoomId()).sendEvent("session_ended", response);
                            server.getRoomOperations(data.getRoomId()).sendEvent("room_updated", Map.of("roomId", data.getRoomId()));
                            log.info("Session concluded in room {} by {}", data.getRoomId(), email);
                        }
                    } catch (Exception e) {
                        client.sendEvent("error", Map.of("message", e.getMessage()));
                    }
                });

        // ── join_session { roomId, userName } ─────────────────────────────────
        server.addEventListener("join_session", JoinRoomPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    if (email == null) { client.disconnect(); return; }
                    try {
                        SessionResponse response = studySessionService.joinActiveSession(data.getRoomId(), email);
                        String name = data.getUserName() != null ? data.getUserName() : email;
                        server.getRoomOperations(data.getRoomId()).sendEvent("participant_joined_session",
                                Map.of("roomId", data.getRoomId(), "userName", name, "email", email));
                        server.getRoomOperations(data.getRoomId()).sendEvent("room_updated", Map.of("roomId", data.getRoomId()));
                        log.info("User {} joined active study session in room {}", email, data.getRoomId());
                    } catch (Exception e) {
                        // non-critical error
                    }
                });

        // ── leave_session { roomId, userName } ────────────────────────────────
        server.addEventListener("leave_session", JoinRoomPayload.class,
                (client, data, ackRequest) -> {
                    String email = getEmail(client);
                    if (email == null) { client.disconnect(); return; }
                    try {
                        studySessionService.leaveActiveSession(data.getRoomId(), email);
                        String name = data.getUserName() != null ? data.getUserName() : email;
                        server.getRoomOperations(data.getRoomId()).sendEvent("participant_left_session",
                                Map.of("roomId", data.getRoomId(), "userName", name, "email", email));
                        server.getRoomOperations(data.getRoomId()).sendEvent("room_updated", Map.of("roomId", data.getRoomId()));
                        log.info("User {} left active study session in room {}", email, data.getRoomId());
                    } catch (Exception e) {
                        // non-critical error
                    }
                });
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    /** Retrieves the authenticated email for this socket session. */
    private String getEmail(SocketIOClient client) {
        return sessionEmailMap.get(client.getSessionId().toString());
    }

    // ─── Payload DTOs (inner classes) ─────────────────────────────────────────
    // These are deserialized from JSON payloads sent by the Socket.IO client.

    public static class JoinRoomPayload {
        private String roomId;
        private String userName;
        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
    }

    public static class LeaveRoomPayload {
        private String roomId;
        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
    }

    public static class SendMessagePayload {
        private String roomId;
        private String message;
        private String senderName;
        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
    }

    public static class TypingPayload {
        private String roomId;
        private String userName;
        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
    }
}
