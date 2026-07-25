package com.stc.stc.services;

import java.util.List;

import com.stc.stc.entity.Friendship;
import com.stc.stc.entity.User;

public interface FriendshipService {

    public Friendship sendFriendRequest(String senderId, String recipientId);

    public Friendship acceptFriendRequest(Long friendshipId, String userId);

    public void rejectOrCancelFriendRequest(Long friendshipId, String userId);

    public Friendship blockUser(String blockerId, String blockedId);

    public List<User> getFriends(String userId);

    public List<Friendship> getPendingFriendRequests(String userId);
}
