package com.stc.stc.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.stc.stc.dto.ChatMessageDto;
import com.stc.stc.dto.CommunityDto;
import com.stc.stc.entity.User;
import com.stc.stc.helper.CurrentUser;
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
    private CurrentUser currentUser;

    @Autowired
    private CommunityMessageService communityMessageService;

    @GetMapping("/conversation/{userId}")
    public List<ChatMessageDto> getConversation(@PathVariable String userId, Authentication authentication) {
        User user = currentUser.require(authentication);
        return messageService.getConversation(user.getUserId(), userId);
    }

    @GetMapping("/unread")
    public List<ChatMessageDto> getUnreadMessages(Authentication authentication) {
        User user = currentUser.require(authentication);
        return messageService.getUnreadMessages(user.getUserId());
    }

    @PutMapping("/{messageId}/read")
    public void markAsRead(@PathVariable Long messageId, Authentication authentication) {
        User user = currentUser.require(authentication);
        messageService.markAsRead(messageId, user.getUserId());
    }

    @GetMapping("/community")
    public List<CommunityDto> getCommunityMessages(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {
        List<CommunityDto> messages = communityMessageService.getRecentMessages(Math.max(page, 0),
                Math.min(Math.max(size, 1), 100));
        Collections.reverse(messages);
        return messages;
    }
}
