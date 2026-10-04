package com.stc.stc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.stc.stc.entity.Role;
import com.stc.stc.entity.User;

public interface UserRepo extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(String keyword);

    @Query("SELECT u FROM User u WHERE u.id != :currentUserId AND " +
            "(LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchPotentialFriends(String keyword, String currentUserId);

    // ---- Admin ----

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    long countByRole(Role role);

    long countByEnabledFalse();

    long countByRoleAndEnabledTrueAndUserIdNot(Role role, String userId);

    // Rows created before the role column existed have role = NULL; treat them as USER.
    @Modifying
    @Query("UPDATE User u SET u.role = :role WHERE u.role IS NULL")
    int assignRoleWhereMissing(@Param("role") Role role);

}
