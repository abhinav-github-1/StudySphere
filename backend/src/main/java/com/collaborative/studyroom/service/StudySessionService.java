package com.collaborative.studyroom.service;

import com.collaborative.studyroom.dto.EndSessionResponse;
import com.collaborative.studyroom.dto.SessionResponse;
import com.collaborative.studyroom.exception.InvalidActionException;
import com.collaborative.studyroom.exception.ResourceNotFoundException;
import com.collaborative.studyroom.exception.UnauthorizedActionException;
import com.collaborative.studyroom.model.ActivityLog;
import com.collaborative.studyroom.model.StudyRoom;
import com.collaborative.studyroom.model.StudySession;
import com.collaborative.studyroom.model.User;
import com.collaborative.studyroom.repository.ActivityLogRepository;
import com.collaborative.studyroom.repository.StudyRoomRepository;
import com.collaborative.studyroom.repository.StudySessionRepository;
import com.collaborative.studyroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudySessionService {

    @Autowired
    private StudySessionRepository studySessionRepository;

    @Autowired
    private StudyRoomRepository studyRoomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    // --- Start Session ---

    /**
     * Spawns a new active study session for the room.
     */
    public SessionResponse startSession(String roomId, String userEmail) {
        // Validate user exists
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        // Validate room exists
        StudyRoom room = studyRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomId));

        // Security check: only room participants can start sessions
        boolean isParticipant = room.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equals(userEmail));
        if (!isParticipant) {
            throw new UnauthorizedActionException("Only members of this room can start a study session.");
        }

        // Validate: Only one active session per room
        studySessionRepository.findByRoomIdAndStatus(roomId, "ACTIVE")
                .ifPresent(s -> {
                    throw new InvalidActionException("A study session is already running in this room.");
                });

        // Initialize active study session record
        StudySession session = new StudySession(roomId, room.getRoomName(), userEmail, user.getFullName());
        session.getParticipants().add(user); // starter is first participant

        StudySession saved = studySessionRepository.save(session);

        // Log starting activity
        logActivity(user.getId(), roomId, "SESSION_STARTED", 
                user.getFullName() + " started a study session in: " + room.getRoomName());

        return mapToResponse(saved);
    }

    // --- End Session ---

    /**
     * Finalizes the study session, calculating duration and updating state.
     */
    public EndSessionResponse endSession(String sessionId, String userEmail) {
        // Validate user exists
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        // Validate session exists
        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Study session not found: " + sessionId));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new InvalidActionException("This session has already been completed.");
        }

        // Security check: only room participants can end sessions
        StudyRoom room = studyRoomRepository.findById(session.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated room not found."));
        
        boolean isParticipant = room.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equals(userEmail));
        if (!isParticipant) {
            throw new UnauthorizedActionException("Only members of this room can manage this study session.");
        }

        // Conclude session details
        LocalDateTime endTime = LocalDateTime.now();
        long duration = Duration.between(session.getStartTime(), endTime).getSeconds();
        if (duration < 0) duration = 0; // prevent negative clock drifts

        session.setEndTime(endTime);
        session.setDurationInSeconds(duration);
        session.setStatus("COMPLETED");

        StudySession completed = studySessionRepository.save(session);

        // Log ending activity
        logActivity(user.getId(), session.getRoomId(), "SESSION_ENDED",
                user.getFullName() + " ended the study session in: " + session.getRoomName() + " (" + (duration / 60) + " minutes)");

        return new EndSessionResponse(
                completed.getId(),
                completed.getRoomName(),
                completed.getStartTime(),
                completed.getEndTime(),
                completed.getDurationInSeconds()
        );
    }

    // --- Join Session ---

    /**
     * Adds an authenticated user to the active session's participants list.
     */
    public SessionResponse joinActiveSession(String roomId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        StudySession session = studySessionRepository.findByRoomIdAndStatus(roomId, "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("No active session found in this room."));

        // Check if user is already registered as participant in this session
        boolean alreadyRegistered = session.getParticipants().stream()
                .anyMatch(p -> p.getEmail().equals(userEmail));

        if (!alreadyRegistered) {
            session.getParticipants().add(user);
            StudySession saved = studySessionRepository.save(session);
            
            // Log join activity
            logActivity(user.getId(), roomId, "SESSION_PARTICIPANT_JOINED",
                    user.getFullName() + " joined the active study session.");
            
            return mapToResponse(saved);
        }

        return mapToResponse(session);
    }

    // --- Leave Session ---

    /**
     * Logs the participant leaving a study session.
     */
    public void leaveActiveSession(String roomId, String userEmail) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            logActivity(user.getId(), roomId, "SESSION_PARTICIPANT_LEFT",
                    user.getFullName() + " left the active study session.");
        });
    }

    // --- Retrievals ---

    /**
     * Returns the current running active session inside the room.
     */
    public SessionResponse getActiveSessionForRoom(String roomId) {
        return studySessionRepository.findByRoomIdAndStatus(roomId, "ACTIVE")
                .map(this::mapToResponse)
                .orElse(null);
    }

    /**
     * Returns completed study room history for a room.
     */
    public List<SessionResponse> getRoomSessionHistory(String roomId) {
        return studySessionRepository.findByRoomId(roomId).stream()
                .filter(s -> "COMPLETED".equals(s.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns all sessions where the user participated.
     */
    public List<SessionResponse> getUserSessionHistory(String userEmail) {
        return studySessionRepository.findByParticipantEmail(userEmail).stream()
                .filter(s -> "COMPLETED".equals(s.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- Private Helpers ---

    private SessionResponse mapToResponse(StudySession session) {
        return new SessionResponse(
                session.getId(),
                session.getRoomId(),
                session.getRoomName(),
                session.getStartedBy(),
                session.getStartedByName(),
                session.getStartTime(),
                session.getEndTime(),
                session.getDurationInSeconds(),
                session.getStatus(),
                session.getParticipants(),
                session.getCreatedAt()
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
            System.err.println("Warning: Session log could not be saved: " + e.getMessage());
        }
    }
}
