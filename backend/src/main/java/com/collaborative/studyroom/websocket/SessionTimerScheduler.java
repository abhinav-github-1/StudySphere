package com.collaborative.studyroom.websocket;

import com.collaborative.studyroom.model.StudySession;
import com.collaborative.studyroom.repository.StudySessionRepository;
import com.corundumstudio.socketio.SocketIOServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * SessionTimerScheduler — absolute source of truth timer heartbeat.
 * Broadcasts elapsed study durations once per second over active Socket.IO channels
 * to eliminate client drift and survive browser restarts.
 */
@Component
public class SessionTimerScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionTimerScheduler.class);

    @Autowired
    private SocketIOServer server;

    @Autowired
    private StudySessionRepository studySessionRepository;

    /**
     * Executes every second, tracking duration of active study sessions
     * and broadcasting updates over room sockets.
     */
    @Scheduled(fixedRate = 1000)
    public void broadcastTimerHeartbeat() {
        try {
            // Find all active sessions in the database
            List<StudySession> activeSessions = studySessionRepository.findByStatus("ACTIVE");

            if (activeSessions.isEmpty()) {
                return; // no active timers
            }

            for (StudySession session : activeSessions) {
                // Calculate accurate elapsed duration on the server
                long duration = Duration.between(session.getStartTime(), LocalDateTime.now()).getSeconds();
                if (duration < 0) duration = 0; // handle safety drift

                // Send real-time synchronized event to room channel
                server.getRoomOperations(session.getRoomId()).sendEvent("timer_update", Map.of(
                        "roomId",            session.getRoomId(),
                        "sessionId",         session.getId(),
                        "roomName",          session.getRoomName() != null ? session.getRoomName() : "",
                        "startedByName",     session.getStartedByName() != null ? session.getStartedByName() : "",
                        "durationInSeconds", duration,
                        "participantCount",  session.getParticipants().size()
                ));
            }
        } catch (Exception e) {
            log.warn("Session timer heartbeat failed: {}", e.getMessage());
        }
    }
}
