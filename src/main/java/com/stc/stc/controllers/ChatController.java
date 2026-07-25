package com.stc.stc.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import com.stc.stc.dto.ChatMessageDto;
import com.stc.stc.dto.CommunityDto;
import com.stc.stc.entity.User;
import com.stc.stc.helper.Helper;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.FriendshipService;
import com.stc.stc.services.MessageService;
import com.stc.stc.services.CommunityMessageService;
import com.stc.stc.helper.MessageType;

@Controller
public class ChatController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private MessageService messageService;

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CommunityMessageService communityMessageService;

    @GetMapping("/user/community")
    public String chat(Authentication authentication, Model model) {
        String username = Helper.getEmailOfLoggedInUser(authentication);

        User user = userRepo.findByEmail(username).orElseThrow(() -> new IllegalStateException("User not found"));

        model.addAttribute("user", user);

        return "user/community";
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public CommunityDto sendMessage(@Payload CommunityDto chatMessage) {
        if (chatMessage.getType() == MessageType.CHAT) {
            return communityMessageService.saveCommunityMessage(chatMessage);
        }
        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public CommunityDto addUser(@Payload CommunityDto chatMessage, SimpMessageHeaderAccessor headerAccessor) {

        // add username in webSocket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        return chatMessage;
    }

    @MessageMapping("/chat.privateMessage")
    public void sendPrivateMessage(@Payload ChatMessageDto message) {
        // Save message and get the stored version with ID
        ChatMessageDto savedMessage = messageService.sendMessage(message);

        // Send confirmation back to sender using email as principal name
        User sender = userRepo.findById(message.getSenderId())
                .orElseThrow(() -> new IllegalStateException("Sender not found"));
        messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/messages",
                savedMessage);
    }

    @GetMapping("/user/chat")
    public String showChatPage(Model model, Authentication authentication) {
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Get the current user's friends only
        List<User> friends = friendshipService.getFriends(currentUser.getUserId());

        model.addAttribute("userId", currentUser.getUserId());
        model.addAttribute("userName", currentUser.getName());
        model.addAttribute("friends", friends);

        return "user/chat";
    }

    @GetMapping("/user/{userId}")
    @ResponseBody
    public User getUserDetails(@PathVariable String userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

}
