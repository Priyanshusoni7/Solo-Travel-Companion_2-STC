package com.stc.stc.services;

import java.util.List;

import com.stc.stc.dto.ChatMessageDto;
import com.stc.stc.entity.Message;

public interface MessageService {

    Message saveMessage(ChatMessageDto chatMessageDTO);

    List<ChatMessageDto> getConversation(String user1Id, String user2Id);

    List<ChatMessageDto> getUnreadMessages(String userId);

    void markAsRead(Long messageId, String currentUserId);

    public ChatMessageDto sendMessage(ChatMessageDto chatMessageDTO);

}
