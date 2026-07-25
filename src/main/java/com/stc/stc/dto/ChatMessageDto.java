package com.stc.stc.dto;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long id;
    private String senderId;
    private String recipientId;
    private String content;
    private Date timestamp;
    private boolean read;
}