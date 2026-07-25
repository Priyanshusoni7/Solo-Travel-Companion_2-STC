package com.stc.stc.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.stc.stc.dto.ChatMessageDto;
import com.stc.stc.dto.CommunityDto;
import com.stc.stc.entity.User;
import com.stc.stc.helper.Helper;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.MessageService;
import com.stc.stc.services.CommunityMessageService;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageRestController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private CommunityMessageService communityMessageService;

    @GetMapping("/conversation/{userId}")
    public List<ChatMessageDto> getConversation(@PathVariable String userId, Authentication authentication) {

        String email = Helper.getEmailOfLoggedInUser(authentication);
        User user = userRepo.findByEmail(email).orElseThrow(() -> new IllegalStateException("User not found"));
        return messageService.getConversation(user.getUserId(), userId);
    }

    @GetMapping("/unread")
    public List<ChatMessageDto> getUnreadMessages(Authentication authentication) {
        String email = Helper.getEmailOfLoggedInUser(authentication);
        User user = userRepo.findByEmail(email).orElseThrow(() -> new IllegalStateException("User not found"));

        String currentUserId = user.getUserId();
        return messageService.getUnreadMessages(currentUserId);
    }

    @PutMapping("/{messageId}/read")
    public void markAsRead(@PathVariable Long messageId) {
        messageService.markAsRead(messageId);
    }

    @GetMapping("/community")
    public List<CommunityDto> getCommunityMessages(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {
        List<CommunityDto> messages = communityMessageService.getRecentMessages(page, size);
        Collections.reverse(messages);
        return messages;
    }
}