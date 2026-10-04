package com.stc.stc.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebConfig webConfig;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The React app connects from its own origin, so the handshake must allow it explicitly
        // (Spring only accepts same-origin WebSocket/SockJS requests by default).
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(webConfig.allowedOriginPatterns().toArray(String[]::new))
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        // Enable both topic (for public messages) and queue (for private messages)
        registry.enableSimpleBroker("/topic", "/queue");
        // Enable user-specific messaging (this is needed for /user/queue/messages)
        registry.setUserDestinationPrefix("/user");
    }

}
