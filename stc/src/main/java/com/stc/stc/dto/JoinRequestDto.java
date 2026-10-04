package com.stc.stc.dto;

import java.time.LocalDateTime;

import com.stc.stc.entity.JoinRequest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequestDto {

    private String requestId;
    private UserDto sender;
    private UserDto owner;
    private String travelId;
    private String destination;
    private String status;
    private String message;
    private LocalDateTime createdAt;

    public static JoinRequestDto from(JoinRequest request) {
        return JoinRequestDto.builder()
                .requestId(request.getRequestId())
                .sender(UserDto.publicView(request.getSender()))
                .owner(UserDto.publicView(request.getOwner()))
                .travelId(request.getTravelPlan().getTravelId())
                .destination(request.getTravelPlan().getDestination())
                .status(request.getStatus())
                .message(request.getMessage())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
