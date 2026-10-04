package com.stc.stc.dto;

import java.time.LocalDate;

import com.stc.stc.entity.Friendship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A pending friend request as seen by its recipient (user1 is the sender). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDto {

    private Long friendshipId;
    private UserDto sender;
    private LocalDate createdAt;

    public static FriendRequestDto from(Friendship friendship) {
        return FriendRequestDto.builder()
                .friendshipId(friendship.getFriendshipId())
                .sender(UserDto.publicView(friendship.getUser1()))
                .createdAt(friendship.getCreatedAt())
                .build();
    }
}
