package com.collaborative.studyroom.controller;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * DiagnosticsController — Production monitoring and service health check endpoints.
 */
@RestController
@RequestMapping("/api")
public class DiagnosticsController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private SocketIOServer socketIOServer;

    @Autowired
    private Environment environment;

    /**
     * GET /api/health
     * Production health status checks for Spring Boot context and MongoDB database connectivity.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> getHealth() {
        Map<String, String> response = new HashMap<>();
        try {
            // Execute ping to verify live connection to MongoDB Atlas
            org.bson.Document ping = new org.bson.Document("ping", 1);
            mongoTemplate.getDb().runCommand(ping);
            
            response.put("status", "UP");
            response.put("database", "CONNECTED");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("database", "DISCONNECTED");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    /**
     * GET /api/debug/config
     * Returns runtime metadata like active profiles and active CORS configurations without exposing credentials.
     */
    @GetMapping("/debug/config")
    public ResponseEntity<Map<String, Object>> getDebugConfig() {
        Map<String, Object> response = new HashMap<>();
        
        // Active profiles context
        response.put("activeProfiles", environment.getActiveProfiles().length == 0 
            ? new String[]{"default"} 
            : environment.getActiveProfiles()
        );
        
        // Active CORS origins settings
        String allowedOrigins = environment.getProperty("app.cors.allowed-origins", "http://localhost:5173,http://127.0.0.1:5173");
        response.put("allowedCorsOrigins", allowedOrigins);
        
        // DB connection status
        String dbStatus = "DISCONNECTED";
        try {
            org.bson.Document ping = new org.bson.Document("ping", 1);
            mongoTemplate.getDb().runCommand(ping);
            dbStatus = "CONNECTED";
        } catch (Exception e) {
            // Do not fail the endpoint, just report disconnected in JSON
        }
        response.put("databaseStatus", dbStatus);
        
        // Socket.IO server running state
        String wsStatus = "STOPPED";
        if (socketIOServer != null) {
            wsStatus = "RUNNING (Port: " + socketIOServer.getConfiguration().getPort() + ")";
        }
        response.put("websocketStatus", wsStatus);
        
        return ResponseEntity.ok(response);
    }
}
