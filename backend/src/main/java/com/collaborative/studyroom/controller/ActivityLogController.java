package com.collaborative.studyroom.controller;

import com.collaborative.studyroom.exception.ResourceNotFoundException;
import com.collaborative.studyroom.model.ActivityLog;
import com.collaborative.studyroom.model.User;
import com.collaborative.studyroom.repository.ActivityLogRepository;
import com.collaborative.studyroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ActivityLogController — REST endpoints to retrieve chronological user
 * and study room activity history lists.
 */
@RestController
@RequestMapping("/api/activity")
public class ActivityLogController extends BaseController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/activity/my-history
     * Returns chronological logs of all actions taken by the authenticated user.
     * Supports simple pagination and sorting.
     */
    @GetMapping("/my-history")
    public ResponseEntity<?> getMyHistory(@RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "15") int limit) {
        try {
            String email = getAuthenticatedEmail();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User profile not found."));

            List<ActivityLog> logs = activityLogRepository.findByUserIdOrderByTimestampDesc(user.getId());

            // Simple pagination logic in memory
            int totalItems = logs.size();
            int totalPages = (int) Math.ceil((double) totalItems / limit);
            
            int fromIndex = (page - 1) * limit;
            int toIndex = Math.min(fromIndex + limit, totalItems);

            List<ActivityLog> paginated = (fromIndex < totalItems && fromIndex >= 0)
                    ? logs.subList(fromIndex, toIndex)
                    : List.of();

            return ResponseEntity.ok(Map.of(
                    "logs", paginated,
                    "currentPage", page,
                    "totalPages", totalPages,
                    "totalItems", totalItems
            ));
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/activity/room/{roomId}
     * Returns chronological timeline logs for a specific room.
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getRoomHistory(@PathVariable String roomId) {
        try {
            List<ActivityLog> logs = activityLogRepository.findByRoomId(roomId);
            
            // Sort by timestamp descending (latest first)
            List<ActivityLog> sorted = logs.stream()
                    .sorted((l1, l2) -> l2.getTimestamp().compareTo(l1.getTimestamp()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(sorted);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
