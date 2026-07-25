package com.stc.stc.dto;

import java.util.Date;
import com.stc.stc.helper.MessageType;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommunityDto {
    private String content;
    private String sender;
    private MessageType type;
    private String senderName;
    private Date timestamp;
}
