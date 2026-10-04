package com.stc.stc.controllers;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.dto.TravelDto;
import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.CommunityMessage;
import com.stc.stc.entity.Role;
import com.stc.stc.entity.StaticPlan;
import com.stc.stc.entity.Travel;
import com.stc.stc.helper.CurrentUser;
import com.stc.stc.repository.CommunityMessageRepository;
import com.stc.stc.repository.TravelRepo;
import com.stc.stc.services.AdminService;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.JoinRequestService;
import com.stc.stc.services.StaticPlanService;
import com.stc.stc.services.TravelService;

import lombok.RequiredArgsConstructor;

/**
 * Admin API. Protected twice: SecurityConfig requires ROLE_ADMIN for /api/admin/**, and
 * the class-level @PreAuthorize repeats the check in case the URL rules ever change.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final TravelService travelService;
    private final JoinRequestService joinRequestService;
    private final StaticPlanService staticPlanService;
    private final ImageService imageService;
    private final TravelRepo travelRepo;
    private final CommunityMessageRepository communityMessageRepository;
    private final CurrentUser currentUser;

    // ---------------------------------------------------------------- overview

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return adminService.getStats();
    }

    // ---------------------------------------------------------------- users

    @GetMapping("/users")
    public Page<UserDto> users(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.searchUsers(keyword, page, size);
    }

    /** body: {"role": "USER" | "ADMIN"} */
    @PatchMapping("/users/{userId}/role")
    public UserDto changeRole(@PathVariable String userId, @RequestBody Map<String, String> body,
            Authentication authentication) {
        Role role;
        try {
            role = Role.valueOf(String.valueOf(body.get("role")));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be USER or ADMIN");
        }
        return adminService.changeRole(currentUser.require(authentication), userId, role);
    }

    /** body: {"enabled": true | false}. Disabled users cannot log in and their open sessions stop working. */
    @PatchMapping("/users/{userId}/status")
    public UserDto changeStatus(@PathVariable String userId, @RequestBody Map<String, Boolean> body,
            Authentication authentication) {
        Boolean enabled = body.get("enabled");
        if (enabled == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "enabled is required");
        }
        return adminService.changeEnabled(currentUser.require(authentication), userId, enabled);
    }

    // ---------------------------------------------------------------- travel plans

    @GetMapping("/travel-plans")
    public Page<TravelDto> travelPlans(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Travel> plans = travelRepo.findByDestinationContainingIgnoreCase(keyword.trim(), pageable);
        return plans.map(plan -> {
            TravelDto dto = TravelDto.from(plan);
            // admins may see the owner's e-mail (hidden from normal users)
            if (dto.getUser() != null) {
                dto.getUser().setEmail(plan.getUser().getEmail());
            }
            dto.setJoinedCount(joinRequestService.getAcceptedRequestsForTravel(plan).size());
            return dto;
        });
    }

    @DeleteMapping("/travel-plans/{travelId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTravelPlan(@PathVariable String travelId) {
        try {
            travelService.deleteTravelPlan(travelId);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Travel plan not found");
        }
    }

    // ---------------------------------------------------------------- community moderation

    @GetMapping("/community-messages")
    public Page<Map<String, Object>> communityMessages(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return communityMessageRepository
                .findByOrderByTimestampDesc(PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)))
                .map(this::toAdminView);
    }

    @DeleteMapping("/community-messages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCommunityMessage(@PathVariable Long id) {
        if (!communityMessageRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found");
        }
        communityMessageRepository.deleteById(id);
    }

    // ---------------------------------------------------------------- featured packages (StaticPlan)

    @GetMapping("/static-plans")
    public List<StaticPlan> staticPlans() {
        return staticPlanService.getAllStaticPlans();
    }

    /**
     * Same fields and logic as the old public POST /static-plans/create (which was reachable
     * without logging in). Now restricted to admins.
     */
    @PostMapping(value = "/static-plans", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public StaticPlan createStaticPlan(
            @RequestParam("title") String title,
            @RequestParam("destination") String destination,
            @RequestParam("description") String description,
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr,
            @RequestParam("price") Double price,
            @RequestParam("planType") String planType,
            @RequestParam(value = "featured", required = false, defaultValue = "false") Boolean featured,
            @RequestParam("maxParticipants") Integer maxParticipants,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        StaticPlan staticPlan = new StaticPlan();
        staticPlan.setTitle(title);
        staticPlan.setDestination(destination);
        staticPlan.setDescription(description);
        staticPlan.setPrice(price);
        staticPlan.setPlanType(planType);
        staticPlan.setFeatured(featured);
        staticPlan.setMaxParticipants(maxParticipants);
        staticPlan.setCurrentParticipants(0); // Initial participants
        staticPlan.setStartDate(toDate(startDateStr));
        staticPlan.setEndDate(toDate(endDateStr));

        // Handle image upload
        if (image != null && !image.isEmpty()) {
            String filename = "static_plan_" + UUID.randomUUID();
            staticPlan.setImageUrl(imageService.uploadImage(image, filename));
        }

        return staticPlanService.saveStaticPlan(staticPlan);
    }

    /** body: {"featured": true | false} */
    @PatchMapping("/static-plans/{id}/featured")
    public StaticPlan setFeatured(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        StaticPlan plan = findStaticPlan(id);
        plan.setFeatured(Boolean.TRUE.equals(body.get("featured")));
        return staticPlanService.saveStaticPlan(plan);
    }

    @DeleteMapping("/static-plans/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStaticPlan(@PathVariable String id) {
        staticPlanService.deleteStaticPlan(findStaticPlan(id).getStaticPlanId());
    }

    // ----------------------------------------------------------------

    private StaticPlan findStaticPlan(String id) {
        try {
            return staticPlanService.getStaticPlanById(id);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Package not found");
        }
    }

    private Map<String, Object> toAdminView(CommunityMessage message) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", message.getId());
        view.put("content", message.getContent());
        view.put("timestamp", message.getTimestamp());
        view.put("senderName", message.getSender().getName());
        view.put("senderEmail", message.getSender().getEmail());
        return view;
    }

    private static Date toDate(String yyyyMMdd) {
        try {
            return Date.from(LocalDate.parse(yyyyMMdd).atStartOfDay(ZoneId.systemDefault()).toInstant());
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dates must be in yyyy-MM-dd format");
        }
    }
}
