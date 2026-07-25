package com.stc.stc.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.stc.stc.entity.Friendship;
import com.stc.stc.entity.User;
import com.stc.stc.helper.Helper;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.FriendshipService;
import java.util.List;

@Controller
@RequestMapping("/user/friends")
public class FriendshipController {

    @Autowired
    private FriendshipService friendshipService;

    @Autowired
    private UserRepo userRepo;

    // Display friends page
    @GetMapping
    public String showFriendsPage(Model model, Authentication authentication) {
        String UserEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(UserEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        List<User> friends = friendshipService.getFriends(currentUser.getUserId());
        List<Friendship> pendingRequests = friendshipService.getPendingFriendRequests(currentUser.getUserId());

        model.addAttribute("friends", friends);
        model.addAttribute("pendingRequests", pendingRequests);

        return "user/friends";
    }

    // Send friend request - AJAX endpoint
    @PostMapping("/request")
    @ResponseBody
    public ResponseEntity<?> sendFriendRequest(@RequestParam String recipientId, Authentication authentication) {
        try {
            System.out.println("recipientIddddd: " + recipientId);
            String UserEmail = Helper.getEmailOfLoggedInUser(authentication);
            User currentUser = userRepo.findByEmail(UserEmail)
                    .orElseThrow(() -> new IllegalStateException("User not found"));
            Friendship request = friendshipService.sendFriendRequest(currentUser.getUserId(), recipientId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Accept friend request - AJAX endpoint
    @PostMapping("/accept")
    @ResponseBody
    public ResponseEntity<?> acceptFriendRequest(@RequestParam Long requestId, Authentication authentication) {
        try {
            String UserEmail = Helper.getEmailOfLoggedInUser(authentication);
            User currentUser = userRepo.findByEmail(UserEmail)
                    .orElseThrow(() -> new IllegalStateException("User not found"));
            Friendship accepted = friendshipService.acceptFriendRequest(requestId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Reject friend request - AJAX endpoint
    @PostMapping("/reject")
    @ResponseBody
    public ResponseEntity<?> rejectFriendRequest(@RequestParam Long requestId, Authentication authentication) {
        try {
            String UserEmail = Helper.getEmailOfLoggedInUser(authentication);
            User currentUser = userRepo.findByEmail(UserEmail)
                    .orElseThrow(() -> new IllegalStateException("User not found"));
            friendshipService.rejectOrCancelFriendRequest(requestId, currentUser.getUserId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Block user - AJAX endpoint
    @PostMapping("/block")
    @ResponseBody
    public ResponseEntity<?> blockUser(@RequestParam String userId, Authentication authentication) {
        try {
            String UserEmail = Helper.getEmailOfLoggedInUser(authentication);
            User currentUser = userRepo.findByEmail(UserEmail)
                    .orElseThrow(() -> new IllegalStateException("User not found"));
            Friendship blocked = friendshipService.blockUser(currentUser.getUserId(), userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}