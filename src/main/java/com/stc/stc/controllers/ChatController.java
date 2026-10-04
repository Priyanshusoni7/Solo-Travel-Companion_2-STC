package com.stc.stc.controllers;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.stc.stc.dto.ChatMessageDto;
import com.stc.stc.dto.CommunityDto;
import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.MessageService;
import com.stc.stc.services.CommunityMessageService;
import com.stc.stc.helper.MessageType;

/**
 * STOMP message handlers (the Thymeleaf page handlers that used to live here are now React routes).
 * The sender is always taken from the authenticated WebSocket session (the principal name is the
 * user's e-mail), never from the client payload, so a user cannot post as someone else.
 */
@Controller
public class ChatController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CommunityMessageService communityMessageService;

    // Community payloads identify people by userId + name; e-mail addresses are never broadcast.
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public CommunityDto sendMessage(@Payload CommunityDto chatMessage, Principal principal) {
        if (chatMessage.getType() == MessageType.CHAT) {
            // the service looks the sender up by e-mail and returns the message with sender = userId
            chatMessage.setSender(principal.getName());
            return communityMessageService.saveCommunityMessage(chatMessage);
        }
        User user = currentUser(principal);
        chatMessage.setSender(user.getUserId());
        chatMessage.setSenderName(user.getName());
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public CommunityDto addUser(@Payload CommunityDto chatMessage, SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        User user = currentUser(principal);
        chatMessage.setSender(user.getUserId());
        chatMessage.setSenderName(user.getName());
        // remembered for the LEAVE event (WebSocketEventListener)
        headerAccessor.getSessionAttributes().put("username", user.getUserId());
        headerAccessor.getSessionAttributes().put("displayName", user.getName());
        return chatMessage;
    }

    private User currentUser(Principal principal) {
        return userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    @MessageMapping("/chat.privateMessage")
    public void sendPrivateMessage(@Payload ChatMessageDto message, Principal principal) {
        User sender = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalStateException("Sender not found"));
        message.setSenderId(sender.getUserId());

        // Save message and get the stored version with ID
        ChatMessageDto savedMessage = messageService.sendMessage(message);

        // Send confirmation back to sender using email as principal name
        messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/messages",
                savedMessage);
    }

}
