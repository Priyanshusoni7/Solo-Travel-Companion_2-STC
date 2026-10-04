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

    /** Removes an accepted friendship between the two users. */
    public void unfriend(String userId, String friendId);

    /** Users that userId has blocked. */
    public List<User> getBlockedUsers(String userId);

    /** Only the user who blocked can unblock; the relationship is removed (back to "not connected"). */
    public void unblockUser(String blockerId, String blockedId);

    /** The friendship row between the two users in either direction, or null. */
    public Friendship findFriendship(String userId, String otherId);
}
