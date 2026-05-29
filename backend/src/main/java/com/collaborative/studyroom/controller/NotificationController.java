package com.collaborative.studyroom.controller;

import com.collaborative.studyroom.model.Notification;
import com.collaborative.studyroom.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * NotificationController — REST endpoints to manage and retrieve in-app alerts.
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController extends BaseController {

    @Autowired
    private NotificationService notificationService;

    /**
     * GET /api/notifications
     * Fetches all alerts for the authenticated user, sorted by newest.
     */
    @GetMapping
    public ResponseEntity<?> getNotifications() {
        try {
            String email = getAuthenticatedEmail();
            List<Notification> list = notificationService.getUserNotifications(email);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/notifications/unread-count
     * Returns the count of unread notifications for display in Navbar badges.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        try {
            String email = getAuthenticatedEmail();
            long count = notificationService.getUnreadCount(email);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/notifications/read/{id}
     * Marks a single alert as read.
     */
    @PostMapping("/read/{id}")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            String email = getAuthenticatedEmail();
            notificationService.markAsRead(id, email);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/notifications/read-all
     * Marks all user alerts as read.
     */
    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            String email = getAuthenticatedEmail();
            notificationService.markAllAsRead(email);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
