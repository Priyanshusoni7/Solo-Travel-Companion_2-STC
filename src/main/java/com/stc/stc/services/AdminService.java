package com.stc.stc.services;

import java.util.Map;

import org.springframework.data.domain.Page;

import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.Role;
import com.stc.stc.entity.User;

/** Admin-only operations. Every caller is protected by ROLE_ADMIN (URL rule + @PreAuthorize). */
public interface AdminService {

    Map<String, Long> getStats();

    Page<UserDto> searchUsers(String keyword, int page, int size);

    UserDto changeRole(User actingAdmin, String userId, Role role);

    UserDto changeEnabled(User actingAdmin, String userId, boolean enabled);
}
