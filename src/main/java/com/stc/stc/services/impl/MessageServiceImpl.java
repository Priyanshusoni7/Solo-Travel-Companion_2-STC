package com.stc.stc.services.impl;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.stc.stc.dto.ChatMessageDto;
import com.stc.stc.entity.Message;
import com.stc.stc.entity.User;
import com.stc.stc.repository.MessageRepository;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.FriendshipService;
import com.stc.stc.services.MessageService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MessageServiceImpl implements MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public Message saveMessage(ChatMessageDto chatMessageDTO) {
        try {
            // Find users
            User sender = userRepository.findById(chatMessageDTO.getSenderId())
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            User recipient = userRepository.findById(chatMessageDTO.getRecipientId())
                    .orElseThrow(() -> new RuntimeException("Recipient not found"));

            // Verify users are friends
            List<User> friends = friendshipService.getFriends(sender.getUserId());
            boolean areFriends = friends.stream()
                    .anyMatch(friend -> friend.getUserId().equals(recipient.getUserId()));

            if (!areFriends) {
                throw new RuntimeException("Cannot send message: Users are not friends");
            }

            // Create and save message
            Message message = new Message();
            message.setSender(sender);
            message.setRecipient(recipient);
            message.setContent(chatMessageDTO.getContent());
            message.setTimestamp(new Date());
            message.setRead(false);

            Message savedMessage = messageRepository.save(message);

            // Convert to DTO for sending
            ChatMessageDto messageDTO = new ChatMessageDto();
            messageDTO.setId(savedMessage.getId());
            messageDTO.setSenderId(sender.getUserId());
            messageDTO.setRecipientId(recipient.getUserId());
            messageDTO.setContent(savedMessage.getContent());
            messageDTO.setTimestamp(savedMessage.getTimestamp());
            messageDTO.setRead(false);

            // Send to recipient's queue using email as principal name
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/messages",
                    messageDTO);

            return savedMessage;
        } catch (Exception e) {
            log.error("Error processing message", e);
            throw e;
        }
    }

    @Override
    public List<ChatMessageDto> getConversation(String user1Id, String user2Id) {
        // Verify users are friends
        if (!areFriends(user1Id, user2Id)) {
            throw new RuntimeException("Cannot view conversation: Users are not friends");
        }

        List<Message> messages = messageRepository.findConversation(user1Id, user2Id);
        return messages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ChatMessageDto> getUnreadMessages(String userId) {
        List<Message> messages = messageRepository.findUnreadMessagesForUser(userId);
        return messages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Long messageId, String currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        // Check that the current user is the recipient
        if (!message.getRecipient().getUserId().equals(currentUserId)) {
            throw new RuntimeException("Not authorized to mark this message as read");
        }

        message.setRead(true);
        messageRepository.save(message);
    }

    @Override
    public ChatMessageDto sendMessage(ChatMessageDto chatMessageDTO) {
        // // Save the message first
        // Message savedMessage = saveMessage(chatMessageDTO);

        // // Convert back to DTO for return
        // ChatMessageDto messageDTO = new ChatMessageDto();
        // messageDTO.setId(savedMessage.getId());
        // messageDTO.setSenderId(savedMessage.getSender().getUserId());
        // messageDTO.setRecipientId(savedMessage.getRecipient().getUserId());
        // messageDTO.setContent(savedMessage.getContent());
        // messageDTO.setTimestamp(savedMessage.getTimestamp());
        // messageDTO.setRead(savedMessage.isRead());

        // return messageDTO;

        try {
            // Find users
            User sender = userRepository.findById(chatMessageDTO.getSenderId())
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            User recipient = userRepository.findById(chatMessageDTO.getRecipientId())
                    .orElseThrow(() -> new RuntimeException("Recipient not found"));

            // Verify users are friends
            if (!areFriends(sender.getUserId(), recipient.getUserId())) {
                throw new RuntimeException("Cannot send message: Users are not friends");
            }

            Message message = new Message();
            message.setSender(sender);
            message.setRecipient(recipient);
            message.setContent(chatMessageDTO.getContent());
            message.setTimestamp(new Date());
            message.setRead(false);

            Message savedMessage = messageRepository.save(message);

            // Convert to DTO
            ChatMessageDto messageDTO = convertToDTO(savedMessage);

            // Send to recipient's queue using email as principal name
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/messages",
                    messageDTO);

            return messageDTO;
        } catch (Exception e) {
            log.error("Error sending message", e);
            throw e;
        }
    }

    private ChatMessageDto convertToDTO(Message message) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(message.getId());
        dto.setSenderId(message.getSender().getUserId());
        dto.setRecipientId(message.getRecipient().getUserId());
        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        dto.setRead(message.isRead());
        return dto;
    }

    private boolean areFriends(String user1Id, String user2Id) {
        List<User> friends = friendshipService.getFriends(user1Id);
        return friends.stream()
                .anyMatch(friend -> friend.getUserId().equals(user2Id));
    }

}
