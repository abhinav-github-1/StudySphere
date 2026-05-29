package com.collaborative.studyroom.websocket;

import com.collaborative.studyroom.security.JwtService;
import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.DependsOn;

/**
 * SocketIOConfig — configures and exposes the Netty Socket.IO server as a Spring bean.
 *
 * Architecture:
 *  - Runs on a SEPARATE port (9092) from the REST API (8085).
 *  - Validates JWT from the handshake query parameter `?token=...`
 *  - Stores the validated email as a session attribute for use in event handlers.
 *  - Started/stopped by SocketIOServerLifecycle component.
 *
 * CORS: allows connections from http://localhost:5173 (Vite dev server).
 */
@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    private static final Logger log = LoggerFactory.getLogger(SocketIOConfig.class);

    @Autowired
    private JwtService jwtService;

    @Value("${socketio.port:9092}")
    private int socketPort;

    @Value("${socketio.host:0.0.0.0}")
    private String socketHost;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    /**
     * Creates and configures the SocketIOServer bean.
     *
     * Key settings:
     *  - origin: allows frontend Vite dev server
     *  - authorization: validates JWT on every connection attempt
     *  - SO_REUSEADDR: prevents "Address already in use" on restarts
     */
    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();

        config.setHostname(socketHost);
        config.setPort(socketPort);

        // Allow frontend origin (CORS for Socket.IO handshake)
        String primaryOrigin = allowedOrigins.split(",")[0].trim();
        config.setOrigin(primaryOrigin);

        // Socket config — reuse address to avoid port-in-use issues after restart
        SocketConfig socketConfig = new SocketConfig();
        socketConfig.setReuseAddress(true);
        config.setSocketConfig(socketConfig);

        // ─── JWT Authorization on Connect ─────────────────────────────────────
        // The client sends ?token=<JWT> in the connection URL.
        // We validate it here before allowing the handshake to complete.
        config.setAuthorizationListener(handshakeData -> {
            try {
                String token = handshakeData.getSingleUrlParam("token");

                if (token == null || token.isBlank()) {
                    log.warn("Socket connection rejected: no token provided");
                    return AuthorizationResult.FAILED_AUTHORIZATION;
                }

                // Extract email from JWT (throws if invalid/expired)
                String email = jwtService.extractEmail(token);

                if (email == null || email.isBlank()) {
                    log.warn("Socket connection rejected: invalid token");
                    return AuthorizationResult.FAILED_AUTHORIZATION;
                }

                log.info("Socket connection authorized for: {}", email);
                return AuthorizationResult.SUCCESSFUL_AUTHORIZATION;

            } catch (Exception e) {
                log.warn("Socket connection rejected: JWT validation failed — {}", e.getMessage());
                return AuthorizationResult.FAILED_AUTHORIZATION;
            }
        });

        // Worker thread count — 1 boss + 2 workers is fine for dev; tune for prod
        config.setBossThreads(1);
        config.setWorkerThreads(2);

        log.info("SocketIOServer configured on {}:{}", socketHost, socketPort);
        return new SocketIOServer(config);
    }
}
