package com.stc.stc.services.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stc.stc.entity.Friendship;
import com.stc.stc.entity.User;
import com.stc.stc.repository.FriendshipRepository;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.FriendshipService;

@Service
public class FriendshipServiceImpl implements FriendshipService {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Override
    public Friendship sendFriendRequest(String senderId, String recipientId) {
        // Get users from DB
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender user not found"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient user not found"));

        // Check if friendship already exists
        Optional<Friendship> existingFriendship = friendshipRepository.findFriendshipBetweenUsers(sender, recipient);

        if (existingFriendship.isPresent()) {
            throw new RuntimeException("Friendship request already exists");
        }

        // Create new friendship request
        Friendship friendship = new Friendship();
        friendship.setUser1(sender);
        friendship.setUser2(recipient);
        friendship.setStatus("pending");

        return friendshipRepository.save(friendship);
    }

    @Override
    public Friendship acceptFriendRequest(Long friendshipId, String userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Friendship request not found"));

        // Verify the user is the recipient
        if (!friendship.getUser2().getUserId().equals(userId)) {
            throw new RuntimeException("Only the request recipient can accept it");
        }

        // Verify status is pending
        if (!"pending".equals(friendship.getStatus())) {
            throw new RuntimeException("This friendship request is not pending");
        }

        friendship.setStatus("accepted");
        return friendshipRepository.save(friendship);
    }

    @Override
    public void rejectOrCancelFriendRequest(Long friendshipId, String userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Friendship request not found"));

        // Verify the user is either the sender or recipient
        if (!friendship.getUser1().getUserId().equals(userId) &&
                !friendship.getUser2().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to modify this friendship");
        }

        friendshipRepository.delete(friendship);
    }

    @Override
    public Friendship blockUser(String blockerId, String blockedId) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new RuntimeException("Blocker user not found"));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new RuntimeException("Blocked user not found"));

        // Check if friendship exists
        Optional<Friendship> existingFriendship = friendshipRepository.findFriendshipBetweenUsers(blocker, blocked);

        Friendship friendship;

        if (existingFriendship.isPresent()) {
            friendship = existingFriendship.get();
            // Ensure blocker is user1 in the relationship for consistency
            if (friendship.getUser2().getUserId().equals(blockerId)) {
                // Swap users to make blocker user1
                User temp = friendship.getUser1();
                friendship.setUser1(friendship.getUser2());
                friendship.setUser2(temp);
            }
        } else {
            friendship = new Friendship();
            friendship.setUser1(blocker);
            friendship.setUser2(blocked);
        }

        friendship.setStatus("blocked");
        return friendshipRepository.save(friendship);
    }

    @Override
    public List<User> getFriends(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Friendship> friendships = friendshipRepository.findAcceptedFriendshipsForUser(user);
        List<User> friends = new ArrayList<>();

        for (Friendship friendship : friendships) {
            if (friendship.getUser1().getUserId().equals(userId)) {
                friends.add(friendship.getUser2());
            } else {
                friends.add(friendship.getUser1());
            }
        }

        return friends;
    }

    @Override
    public List<Friendship> getPendingFriendRequests(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return friendshipRepository.findPendingFriendRequestsForUser(user);
    }

}
