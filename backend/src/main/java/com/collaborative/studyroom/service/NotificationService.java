package com.collaborative.studyroom.service;

import com.collaborative.studyroom.model.Notification;
import com.collaborative.studyroom.repository.NotificationRepository;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SocketIOServer socketIOServer;

    /**
     * Spawns an in-app alert, saves it, and pushes it over the user's targeted socket room.
     */
    public Notification createNotification(String email, String title, String message, String type) {
        Notification notification = new Notification(email, title, message, type);
        Notification saved = notificationRepository.save(notification);

        // Targeted live WebSocket delivery
        try {
            socketIOServer.getRoomOperations("user_" + email)
                    .sendEvent("notification_created", Map.of(
                            "id",        saved.getId(),
                            "title",     saved.getTitle(),
                            "message",   saved.getMessage(),
                            "type",      saved.getType(),
                            "isRead",    saved.isRead(),
                            "createdAt", saved.getCreatedAt().toString()
                    ));
        } catch (Exception e) {
            System.err.println("Warning: Socket push for notification failed: " + e.getMessage());
        }

        return saved;
    }

    /**
     * Retrieves all persistent notifications for the user.
     */
    public List<Notification> getUserNotifications(String email) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(email);
    }

    /**
     * Marks a single notification as read.
     */
    public void markAsRead(String notificationId, String email) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(email)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    /**
     * Marks all user notifications as read.
     */
    public void markAllAsRead(String email) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(email);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    /**
     * Gets count of unread notifications.
     */
    public long getUnreadCount(String email) {
        return notificationRepository.countByUserIdAndIsReadFalse(email);
    }
}
