package com.stc.stc.services.impl;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.Role;
import com.stc.stc.entity.User;
import com.stc.stc.repository.CommunityMessageRepository;
import com.stc.stc.repository.FriendshipRepository;
import com.stc.stc.repository.JoinRequestRepository;
import com.stc.stc.repository.MessageRepository;
import com.stc.stc.repository.StaticPlanRepository;
import com.stc.stc.repository.TravelRepo;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.AdminService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepo userRepo;
    private final TravelRepo travelRepo;
    private final JoinRequestRepository joinRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final MessageRepository messageRepository;
    private final CommunityMessageRepository communityMessageRepository;
    private final StaticPlanRepository staticPlanRepository;

    @Override
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("users", userRepo.count());
        stats.put("admins", userRepo.countByRole(Role.ADMIN));
        stats.put("disabledUsers", userRepo.countByEnabledFalse());
        stats.put("travelPlans", travelRepo.count());
        stats.put("openPlans", travelRepo.countByPlanStatus("OPEN"));
        stats.put("closedPlans", travelRepo.countByPlanStatus("CLOSED"));
        stats.put("pendingJoinRequests", joinRequestRepository.countByStatus("PENDING"));
        stats.put("acceptedJoinRequests", joinRequestRepository.countByStatus("ACCEPTED"));
        stats.put("friendships", friendshipRepository.countByStatus("accepted"));
        stats.put("privateMessages", messageRepository.count());
        stats.put("communityMessages", communityMessageRepository.count());
        stats.put("staticPlans", staticPlanRepository.count());
        stats.put("featuredPlans", staticPlanRepository.countByFeaturedTrue());
        return stats;
    }

    @Override
    public Page<UserDto> searchUsers(String keyword, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by("name").ascending());
        return userRepo.searchUsers(keyword == null ? "" : keyword.trim(), pageable).map(UserDto::fullView);
    }

    @Override
    @Transactional
    public UserDto changeRole(User actingAdmin, String userId, Role role) {
        User target = findUser(userId);
        if (target.getUserId().equals(actingAdmin.getUserId()) && role != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot remove your own admin role");
        }
        if (target.isAdmin() && role != Role.ADMIN) {
            ensureAnotherAdminRemains(target);
        }
        target.setRole(role);
        return UserDto.fullView(userRepo.save(target));
    }

    @Override
    @Transactional
    public UserDto changeEnabled(User actingAdmin, String userId, boolean enabled) {
        User target = findUser(userId);
        if (target.getUserId().equals(actingAdmin.getUserId()) && !enabled) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot disable your own account");
        }
        if (target.isAdmin() && !enabled) {
            ensureAnotherAdminRemains(target);
        }
        target.setEnabled(enabled);
        return UserDto.fullView(userRepo.save(target));
    }

    private User findUser(String userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    /** Never let the application end up with no usable admin account. */
    private void ensureAnotherAdminRemains(User target) {
        if (userRepo.countByRoleAndEnabledTrueAndUserIdNot(Role.ADMIN, target.getUserId()) == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one active admin must remain");
        }
    }
}
