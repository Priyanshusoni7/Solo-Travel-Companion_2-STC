package com.stc.stc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.stc.stc.entity.User;

public interface UserRepo extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(String keyword);

    @Query("SELECT u FROM User u WHERE u.id != :currentUserId AND " +
            "(LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchPotentialFriends(String keyword, String currentUserId);

}
