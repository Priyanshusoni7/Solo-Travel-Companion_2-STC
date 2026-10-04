package com.stc.stc.services.impl;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.stc.stc.entity.Role;
import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.UserService;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // save user
    @Override
    public User saveUser(User user) {

        String UserId = UUID.randomUUID().toString();
        user.setUserId(UserId);

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEmailVerified(true);
        user.setEnabled(true);
        user.setPhoneVerified(true);
        // Every self-registered account is a normal user; ADMIN is only granted explicitly.
        user.setRole(Role.USER);

        return userRepo.save(user);
    }

    // cache — the explore feed shows each plan owner's name and photo
    @Override
    @CacheEvict(value = "exploreTrips", allEntries = true)
    public User updateProfile(User user) {
        return userRepo.save(user);
    }

    @Override
    public User profile(String email) {

        User user = userRepo.findByEmail(email).orElseThrow(() -> new IllegalStateException("User not found"));

        return user;
    }

    @Override
    public List<User> searchUsers(String keyword) {

        return userRepo.searchUsers(keyword);
    }

    @Override
    public List<User> searchPotentialFriends(String keyword, String currentUserId) {
        return userRepo.searchPotentialFriends(keyword, currentUserId);
    }

}
