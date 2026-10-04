package com.stc.stc.helper;

import lombok.RequiredArgsConstructor;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.stc.stc.dto.CommunityDto;

import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messageTemplate;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // set in ChatController#addUser: username = userId, displayName = name
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            // log.info("User Disconnected : {}", username);
            var chatMessage = CommunityDto.builder()
                    .type(MessageType.LEAVE)
                    .sender(username)
                    .senderName((String) headerAccessor.getSessionAttributes().get("displayName"))
                    .build();

            messageTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }

}
