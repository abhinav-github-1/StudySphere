package com.collaborative.studyroom.controller;

import com.collaborative.studyroom.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * DashboardController — Exposes analytical dashboard reports and timelines.
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController extends BaseController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * GET /api/dashboard/overview
     * Returns consolidated dashboard statistics, streak trackers,
     * productivity graphs, activity logs, and completed session history.
     */
    @GetMapping("/overview")
    public ResponseEntity<?> getDashboardOverview() {
        try {
            String userEmail = getAuthenticatedEmail();
            Map<String, Object> overview = dashboardService.getDashboardOverview(userEmail);
            return ResponseEntity.ok(overview);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
