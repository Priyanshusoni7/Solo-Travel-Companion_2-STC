package com.stc.stc.services.impl;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.stc.stc.dto.CommunityDto;
import com.stc.stc.entity.CommunityMessage;
import com.stc.stc.entity.User;
import com.stc.stc.helper.MessageType;
import com.stc.stc.repository.CommunityMessageRepository;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.CommunityMessageService;

@Service
public class CommunityMessageServiceImpl implements CommunityMessageService {

    @Autowired
    private CommunityMessageRepository communityMessageRepository;

    @Autowired
    private UserRepo userRepo;

    @Override
    public CommunityDto saveCommunityMessage(CommunityDto dto) {
        User sender = userRepo.findByEmail(dto.getSender())
                .orElseThrow(() -> new RuntimeException("Sender not found with email: " + dto.getSender()));

        CommunityMessage message = CommunityMessage.builder()
                .sender(sender)
                .content(dto.getContent())
                .timestamp(new Date())
                .build();

        CommunityMessage savedMessage = communityMessageRepository.save(message);

        dto.setTimestamp(savedMessage.getTimestamp());
        dto.setSenderName(sender.getName());
        return dto;
    }

    @Override
    public List<CommunityDto> getRecentMessages(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CommunityMessage> messagesPage = communityMessageRepository.findByOrderByTimestampDesc(pageable);

        return messagesPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private CommunityDto convertToDto(CommunityMessage message) {
        return CommunityDto.builder()
                .content(message.getContent())
                .sender(message.getSender().getEmail())
                .senderName(message.getSender().getName())
                .timestamp(message.getTimestamp())
                .type(MessageType.CHAT)
                .build();
    }
}
