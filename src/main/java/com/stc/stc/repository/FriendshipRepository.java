package com.stc.stc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.stc.stc.entity.Friendship;
import com.stc.stc.entity.User;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Find friendship between two users (in either direction)
    @Query("SELECT f FROM Friendship f WHERE (f.user1 = ?1 AND f.user2 = ?2) OR (f.user1 = ?2 AND f.user2 = ?1)")
    Optional<Friendship> findFriendshipBetweenUsers(User user1, User user2);

    // Find all friendships where a user is involved
    @Query("SELECT f FROM Friendship f WHERE f.user1 = ?1 OR f.user2 = ?1")
    List<Friendship> findAllFriendshipsForUser(User user);

    // Find all accepted friendships for a user
    @Query("SELECT f FROM Friendship f WHERE (f.user1 = ?1 OR f.user2 = ?1) AND f.status = 'accepted'")
    List<Friendship> findAcceptedFriendshipsForUser(User user);

    // Find all pending friendships where user is the recipient
    @Query("SELECT f FROM Friendship f WHERE f.user2 = ?1 AND f.status = 'pending'")
    List<Friendship> findPendingFriendRequestsForUser(User user);
}