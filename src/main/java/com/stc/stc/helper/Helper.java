package com.stc.stc.helper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;

import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;

public class Helper {

    @Autowired
    private static UserRepo userRepo;

    public static String getEmailOfLoggedInUser(Authentication authentication) {

        return authentication.getName();
    }

    public static String getUserIdFromAuthentication(Authentication authentication) {
        String email = getEmailOfLoggedInUser(authentication);
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return user.getUserId();
    }
}
