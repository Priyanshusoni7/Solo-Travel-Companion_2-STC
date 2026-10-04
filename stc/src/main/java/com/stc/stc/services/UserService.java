package com.stc.stc.services;

import java.util.List;

import com.stc.stc.entity.User;

public interface UserService {

    public User saveUser(User user);

    public User profile(String email);

    public List<User> searchUsers(String keyword);

    public List<User> searchPotentialFriends(String keyword, String currentUserId);

    /** Saves profile changes of an existing user (no ID regeneration, no password re-encoding). */
    public User updateProfile(User user);

}
