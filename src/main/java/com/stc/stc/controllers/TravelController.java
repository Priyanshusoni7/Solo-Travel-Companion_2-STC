package com.stc.stc.controllers;

import java.sql.Date;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.dto.TravelDto;
import com.stc.stc.dto.TravelPlanRequest;
import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.JoinRequest;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.helper.CurrentUser;
import com.stc.stc.helper.TripClock;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.JoinRequestService;
import com.stc.stc.services.TravelService;

import lombok.RequiredArgsConstructor;

/** REST version of the old Thymeleaf TravelController + the join action of JoinRequestController. */
@RestController
@RequestMapping("/api/travel")
@RequiredArgsConstructor
public class TravelController {

    private static final int MAX_COMPANIONS_LIMIT = 100;

    private final TravelService travelService;
    private final JoinRequestService joinRequestService;
    private final ImageService imageService;
    private final UserRepo userRepo;
    private final CurrentUser currentUser;
    private final TripClock tripClock;

    /**
     * Explore feed with filters and pagination. Filtering happens on the Redis-cached list of all
     * plans (TravelServiceImpl#getAllTravelPlan), so the cache keeps working exactly as before.
     *
     * interest  - matches one of the plan's interests (case-insensitive)
     * from / to - trip overlaps this date range
     * openOnly  - only plans that currently accept companions (OPEN, not started, not full)
     * hideEnded - hide trips whose end date has passed (default true)
     */
    @GetMapping
    public Page<TravelDto> explore(
            @RequestParam(required = false) String interest,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "false") boolean openOnly,
            @RequestParam(defaultValue = "true") boolean hideEnded,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        LocalDate today = tripClock.today();
        List<TravelDto> plans = travelService.getAllTravelPlan().stream().map(TravelDto::from).toList();

        Map<String, Long> accepted = joinRequestService.countAcceptedByTravelIds(
                plans.stream().map(TravelDto::getTravelId).toList());
        plans.forEach(p -> p.setJoinedCount(accepted.getOrDefault(p.getTravelId(), 0L).intValue()));

        List<TravelDto> filtered = plans.stream()
                .filter(p -> !StringUtils.hasText(interest) || hasInterest(p.getInterest(), interest))
                .filter(p -> from == null || p.getEndDate() == null || !p.getEndDate().isBefore(from))
                .filter(p -> to == null || p.getStartDate() == null || !p.getStartDate().isAfter(to))
                .filter(p -> !hideEnded || p.getEndDate() == null || !p.getEndDate().isBefore(today))
                .filter(p -> !openOnly || joinBlockReason(p.getPlanStatus(), p.getStartDate(),
                        p.getMaxCompanions(), p.getJoinedCount(), today) == null)
                .sorted(Comparator.comparing(TravelDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int pageSize = Math.min(Math.max(size, 1), 50);
        int pageNumber = Math.max(page, 0);
        int start = Math.min(pageNumber * pageSize, filtered.size());
        int end = Math.min(start + pageSize, filtered.size());
        return new PageImpl<>(filtered.subList(start, end), PageRequest.of(pageNumber, pageSize), filtered.size());
    }

    @GetMapping("/mine")
    public List<TravelDto> myPlans(Authentication authentication) {
        User me = currentUser.require(authentication);
        return travelService.TravelPlanByUser(me.getEmail()).stream()
                .map(plan -> {
                    TravelDto dto = TravelDto.from(plan);
                    dto.setJoinedCount((int) joinRequestService.countAccepted(plan));
                    return dto;
                })
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TravelDto create(@RequestBody TravelPlanRequest request, Authentication authentication) {
        validate(request);
        User me = currentUser.require(authentication);

        Travel plan = new Travel();
        apply(plan, request);
        plan.setUser(me);

        // Let the service handle ID generation and timestamp
        travelService.saveTravelPlan(plan);
        return TravelDto.from(plan);
    }

    /** Detail page data: plan, owner, joined companions and the viewer's join-request status. */
    @GetMapping("/{id}")
    public Map<String, Object> view(@PathVariable String id, Authentication authentication) {
        User me = currentUser.require(authentication);
        Travel plan = findPlan(id);
        User owner = plan.getUser();

        List<UserDto> joinedUsers = joinRequestService.getAcceptedRequestsForTravel(plan).stream()
                .map(JoinRequest::getSender)
                .map(UserDto::publicView)
                .toList();

        TravelDto planDto = TravelDto.from(plan);
        planDto.setJoinedCount(joinedUsers.size());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("plan", planDto);
        body.put("owner", UserDto.publicView(owner));
        body.put("isOwner", owner.getUserId().equals(me.getUserId()));
        JoinRequest myRequest = joinRequestService.findRequest(me, plan).orElse(null);
        body.put("requestStatus", myRequest == null ? null : myRequest.getStatus());
        body.put("requestId", myRequest == null ? null : myRequest.getRequestId());
        body.put("joinedUsers", joinedUsers);
        body.put("joinedCount", joinedUsers.size());
        // null = new join requests are possible; otherwise CLOSED | STARTED | FULL
        body.put("joinBlockedReason", joinBlockReason(plan, joinedUsers.size()));
        return body;
    }

    @PutMapping("/{id}")
    public TravelDto update(@PathVariable String id, @RequestBody TravelPlanRequest request,
            Authentication authentication) {
        validate(request);
        User me = currentUser.require(authentication);
        Travel existingPlan = findOwnPlan(id, me);

        apply(existingPlan, request);
        travelService.updateTravelPlan(existingPlan);
        return TravelDto.from(existingPlan);
    }

    /** The owner deletes their plan; its join requests are deleted with it (same logic as admin delete). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, Authentication authentication) {
        User me = currentUser.require(authentication);
        findOwnPlan(id, me);
        travelService.deleteTravelPlan(id);
    }

    /** My plans, each with the companions whose join request was accepted. */
    @GetMapping("/my-joined-users")
    public List<Map<String, Object>> myJoinedUsers(Authentication authentication) {
        User me = currentUser.require(authentication);
        return travelService.TravelPlanByUser(me.getEmail()).stream()
                .map(plan -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("plan", TravelDto.from(plan));
                    entry.put("joinedUsers", joinRequestService.getAcceptedRequestsForTravel(plan).stream()
                            .map(JoinRequest::getSender)
                            .map(UserDto::publicView)
                            .toList());
                    return entry;
                })
                .toList();
    }

    @PostMapping("/{id}/join")
    public Map<String, String> join(@PathVariable String id, @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        User me = currentUser.require(authentication);
        Travel plan = findPlan(id);
        User planOwner = plan.getUser();

        // Cannot join your own plan
        if (planOwner.getUserId().equals(me.getUserId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot join your own travel plan");
        }

        // A pending/accepted request stays as it is; the guards below only stop NEW requests
        String currentStatus = joinRequestService.getRequestStatus(me, plan);
        boolean alreadyActive = "PENDING".equals(currentStatus) || "ACCEPTED".equals(currentStatus);
        if (!alreadyActive) {
            String reason = joinBlockReason(plan, (int) joinRequestService.countAccepted(plan));
            if (reason != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, joinBlockMessage(reason));
            }
        }

        String message = body == null ? null : body.get("message");
        JoinRequest request = joinRequestService.createJoinRequest(me, planOwner, plan, message);
        return Map.of("message", "Join request sent successfully", "status", request.getStatus());
    }

    /** An accepted companion leaves the trip. */
    @PostMapping("/{id}/leave")
    public Map<String, String> leave(@PathVariable String id, Authentication authentication) {
        User me = currentUser.require(authentication);
        joinRequestService.leaveTrip(findPlan(id), me);
        return Map.of("message", "You have left this trip");
    }

    /** The owner removes an accepted companion. */
    @PostMapping("/{id}/companions/{userId}/remove")
    public Map<String, String> removeCompanion(@PathVariable String id, @PathVariable String userId,
            Authentication authentication) {
        User me = currentUser.require(authentication);
        Travel plan = findOwnPlan(id, me);
        User companion = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        joinRequestService.removeCompanion(plan, companion);
        return Map.of("message", "Companion removed from this trip");
    }

    /** Owner uploads / replaces the plan's cover photo (Cloudinary, same upload as profile pictures). */
    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TravelDto uploadCover(@PathVariable String id, @RequestParam("image") MultipartFile image,
            Authentication authentication) {
        User me = currentUser.require(authentication);
        Travel plan = findOwnPlan(id, me);
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose an image");
        }
        String url = imageService.uploadImage(image, "travel_cover_" + UUID.randomUUID());
        if (url == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image upload failed, please try again");
        }
        plan.setCoverImageUrl(url);
        travelService.updateTravelPlan(plan);
        return TravelDto.from(plan);
    }

    @DeleteMapping("/{id}/cover")
    public TravelDto removeCover(@PathVariable String id, Authentication authentication) {
        User me = currentUser.require(authentication);
        Travel plan = findOwnPlan(id, me);
        plan.setCoverImageUrl(null);
        travelService.updateTravelPlan(plan);
        return TravelDto.from(plan);
    }

    // -------------------------------------------------------------------------

    private Travel findPlan(String id) {
        try {
            return travelService.getTravelPlanById(id);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Travel plan not found");
        }
    }

    private Travel findOwnPlan(String id, User me) {
        Travel plan = findPlan(id);
        // Check if user owns this plan
        if (!plan.getUser().getUserId().equals(me.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only change your own travel plans");
        }
        return plan;
    }

    private String joinBlockReason(Travel plan, int acceptedCount) {
        return joinBlockReason(plan.getPlanStatus(), plan.getStartDate() == null ? null : plan.getStartDate().toLocalDate(),
                plan.getMaxCompanions(), acceptedCount, tripClock.today());
    }

    /** Why new join requests are not possible right now, or null if they are. */
    private static String joinBlockReason(String planStatus, LocalDate startDate, Integer maxCompanions,
            Integer acceptedCount, LocalDate today) {
        if ("CLOSED".equals(planStatus)) {
            return "CLOSED";
        }
        if (startDate != null && !today.isBefore(startDate)) {
            return "STARTED";
        }
        if (maxCompanions != null && acceptedCount != null && acceptedCount >= maxCompanions) {
            return "FULL";
        }
        return null;
    }

    private static String joinBlockMessage(String reason) {
        return switch (reason) {
            case "STARTED" -> "This trip has already started and is no longer accepting companions";
            case "FULL" -> "This trip is full";
            default -> "This travel plan is not accepting companions";
        };
    }

    private static boolean hasInterest(String planInterest, String wanted) {
        if (planInterest == null) {
            return false;
        }
        for (String interest : planInterest.split(",")) {
            if (interest.trim().equalsIgnoreCase(wanted.trim())) {
                return true;
            }
        }
        return false;
    }

    private void validate(TravelPlanRequest request) {
        if (!StringUtils.hasText(request.getDestination()) || request.getStartDate() == null
                || request.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destination, start date and end date are required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }
        Integer max = request.getMaxCompanions();
        if (max != null && (max < 1 || max > MAX_COMPANIONS_LIMIT)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Maximum companions must be between 1 and " + MAX_COMPANIONS_LIMIT + " (or empty for no limit)");
        }
    }

    private void apply(Travel plan, TravelPlanRequest request) {
        plan.setDestination(request.getDestination().trim());
        plan.setInterest(request.getInterest());
        plan.setPlanStatus(StringUtils.hasText(request.getPlanStatus()) ? request.getPlanStatus() : "OPEN");
        plan.setStartDate(Date.valueOf(request.getStartDate()));
        plan.setEndDate(Date.valueOf(request.getEndDate()));
        plan.setDayItineraries(request.cleanedItineraries());
        plan.setMaxCompanions(request.getMaxCompanions());
        // A trip that has already started can't be (re)opened: same rule as the auto-close job
        if (!tripClock.today().isBefore(request.getStartDate())) {
            plan.setPlanStatus("CLOSED");
        }
    }
}
