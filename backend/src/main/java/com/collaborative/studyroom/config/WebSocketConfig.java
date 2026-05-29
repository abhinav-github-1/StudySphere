package com.collaborative.studyroom.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefix for server-to-client messages (subscribing to updates)
        config.enableSimpleBroker("/topic");
        // Prefix for client-to-server messages
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Socket connection endpoint, configured with CORS for default React Vite port
        registry.addEndpoint("/ws-study")
                .setAllowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .withSockJS();
    }
}
