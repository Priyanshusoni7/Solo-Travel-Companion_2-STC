package com.stc.stc.helper;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;

import lombok.RequiredArgsConstructor;

/** Resolves the logged-in {@link User} (the principal name is the user's e-mail). */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepo userRepo;

    public User require(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }
        return userRepo.findByEmail(Helper.getEmailOfLoggedInUser(authentication))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
