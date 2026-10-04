package com.stc.stc.controllers;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.dto.FriendRequestDto;
import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.Friendship;
import com.stc.stc.entity.User;
import com.stc.stc.helper.CurrentUser;
import com.stc.stc.services.FriendshipService;

import lombok.RequiredArgsConstructor;

/** Same operations as the old AJAX endpoints under /user/friends, now JSON under /api/friends. */
@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;
    private final CurrentUser currentUser;

    @GetMapping
    public List<UserDto> friends(Authentication authentication) {
        User me = currentUser.require(authentication);
        return friendshipService.getFriends(me.getUserId()).stream().map(UserDto::publicView).toList();
    }

    @GetMapping("/pending")
    public List<FriendRequestDto> pending(Authentication authentication) {
        User me = currentUser.require(authentication);
        return friendshipService.getPendingFriendRequests(me.getUserId()).stream()
                .map(FriendRequestDto::from).toList();
    }

    /** body: {"recipientId": "..."} */
    @PostMapping("/request")
    public Map<String, String> sendFriendRequest(@RequestBody Map<String, String> body, Authentication authentication) {
        User me = currentUser.require(authentication);
        if (me.getUserId().equals(body.get("recipientId"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot send a friend request to yourself");
        }
        friendshipService.sendFriendRequest(me.getUserId(), body.get("recipientId"));
        return Map.of("message", "Friend request sent successfully!");
    }

    @PostMapping("/{friendshipId}/accept")
    public Map<String, String> accept(@PathVariable Long friendshipId, Authentication authentication) {
        User me = currentUser.require(authentication);
        friendshipService.acceptFriendRequest(friendshipId, me.getUserId());
        return Map.of("message", "Friend request accepted!");
    }

    @PostMapping("/{friendshipId}/reject")
    public Map<String, String> reject(@PathVariable Long friendshipId, Authentication authentication) {
        User me = currentUser.require(authentication);
        friendshipService.rejectOrCancelFriendRequest(friendshipId, me.getUserId());
        return Map.of("message", "Friend request declined");
    }

    /** Removes the friendship (no block; either side may send a new request later). */
    @DeleteMapping("/{friendId}")
    public Map<String, String> unfriend(@PathVariable String friendId, Authentication authentication) {
        User me = currentUser.require(authentication);
        friendshipService.unfriend(me.getUserId(), friendId);
        return Map.of("message", "Friend removed");
    }

    /** Users the current user has blocked. */
    @GetMapping("/blocked")
    public List<UserDto> blocked(Authentication authentication) {
        User me = currentUser.require(authentication);
        return friendshipService.getBlockedUsers(me.getUserId()).stream().map(UserDto::publicView).toList();
    }

    /** body: {"userId": "..."} */
    @PostMapping("/unblock")
    public Map<String, String> unblock(@RequestBody Map<String, String> body, Authentication authentication) {
        User me = currentUser.require(authentication);
        friendshipService.unblockUser(me.getUserId(), body.get("userId"));
        return Map.of("message", "User unblocked");
    }

    /**
     * Relationship with another user, used to explain why chat isn't possible:
     * {"status": NONE | FRIENDS | PENDING_SENT | PENDING_RECEIVED | BLOCKED | BLOCKED_BY_OTHER, "friendshipId": ...}
     */
    @GetMapping("/status/{userId}")
    public Map<String, Object> status(@PathVariable String userId, Authentication authentication) {
        User me = currentUser.require(authentication);
        Friendship friendship = friendshipService.findFriendship(me.getUserId(), userId);

        String status;
        if (friendship == null) {
            status = "NONE";
        } else if ("accepted".equals(friendship.getStatus())) {
            status = "FRIENDS";
        } else if ("pending".equals(friendship.getStatus())) {
            // user1 is always the sender of a request
            status = friendship.getUser1().getUserId().equals(me.getUserId()) ? "PENDING_SENT" : "PENDING_RECEIVED";
        } else {
            // blockUser() stores the blocker as user1
            status = friendship.getUser1().getUserId().equals(me.getUserId()) ? "BLOCKED" : "BLOCKED_BY_OTHER";
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status);
        body.put("friendshipId", "PENDING_RECEIVED".equals(status) ? friendship.getFriendshipId() : null);
        return body;
    }

    /** body: {"userId": "..."} */
    @PostMapping("/block")
    public Map<String, String> block(@RequestBody Map<String, String> body, Authentication authentication) {
        User me = currentUser.require(authentication);
        friendshipService.blockUser(me.getUserId(), body.get("userId"));
        return Map.of("message", "User has been blocked");
    }
}
