package com.stc.stc.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.helper.Helper;
import com.stc.stc.services.TravelService;
import com.stc.stc.services.UserService;

@Controller
public class SearchController {
    @Autowired
    private UserService userService;

    @Autowired
    private TravelService travelService;

    @GetMapping("/user/search")
    public ResponseEntity<?> search(@RequestParam String keyword, @RequestParam(required = false, defaultValue = "companion") String type, Model model, Authentication authentication) {
        if (type.equals("companion")) {
            List<User> users = userService.searchUsers(keyword);
            return ResponseEntity.ok(users);
        } else if (type.equals("friend")) {
            // Get current user to exclude from results
            String userEmail = Helper.getEmailOfLoggedInUser(authentication);
            User currentUser = userService.profile(userEmail);
            List<User> potentialFriends = userService.searchPotentialFriends(keyword, currentUser.getUserId());
            return ResponseEntity.ok(potentialFriends);
        } else {
            List<Travel> travels = travelService.searchTravels(keyword);
            return ResponseEntity.ok(travels);
        }
    }

}
