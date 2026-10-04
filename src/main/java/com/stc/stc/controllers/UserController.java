package com.stc.stc.controllers;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.dto.ProfileUpdateDto;
import com.stc.stc.dto.TravelDto;
import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.StaticPlan;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.helper.CurrentUser;
import com.stc.stc.helper.TripClock;
import com.stc.stc.repository.TravelRepo;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.FriendshipService;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.JoinRequestService;
import com.stc.stc.services.StaticPlanService;
import com.stc.stc.services.TravelService;
import com.stc.stc.services.UserService;

import lombok.RequiredArgsConstructor;

/** User lookup, search (was SearchController) and featured packages for the dashboard. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepo userRepo;
    private final UserService userService;
    private final TravelService travelService;
    private final StaticPlanService staticPlanService;
    private final CurrentUser currentUser;
    private final ImageService imageService;
    private final JoinRequestService joinRequestService;
    private final FriendshipService friendshipService;
    private final TravelRepo travelRepo;
    private final TripClock tripClock;

    /** Public profile of another user (replaces GET /user/{userId}, which returned the raw entity). */
    @GetMapping("/users/{userId}")
    public UserDto getUser(@PathVariable String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserDto.publicView(user);
    }

    /** type = companion (default) | friend | travelplan — same semantics as the old /user/search. */
    @GetMapping("/search")
    public List<?> search(@RequestParam String keyword,
            @RequestParam(required = false, defaultValue = "companion") String type,
            Authentication authentication) {
        if (type.equals("companion")) {
            return userService.searchUsers(keyword).stream().map(UserDto::publicView).toList();
        } else if (type.equals("friend")) {
            // Get current user to exclude from results
            User me = currentUser.require(authentication);
            return userService.searchPotentialFriends(keyword, me.getUserId()).stream()
                    .map(UserDto::publicView).toList();
        } else {
            return travelService.searchTravels(keyword).stream().map(TravelDto::from).toList();
        }
    }

    /** Edit own profile (name, contact, location, about, photo). */
    @PutMapping(value = "/users/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserDto updateMyProfile(@ModelAttribute ProfileUpdateDto form, Authentication authentication) {
        User me = currentUser.require(authentication);
        if (!StringUtils.hasText(form.getName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }

        me.setName(form.getName().trim());
        me.setPhoneNumber(form.getPhoneNumber());
        me.setGender(form.getGender());
        me.setLanguage(form.getLanguage());
        me.setCountry(form.getCountry());
        me.setState(form.getState());
        me.setCity(form.getCity());
        me.setAbout(form.getAbout());

        if (form.getProfilePic() != null && !form.getProfilePic().isEmpty()) {
            String url = imageService.uploadImage(form.getProfilePic(), UUID.randomUUID().toString());
            if (url == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image upload failed, please try again");
            }
            me.setProfilePic(url);
        } else if (form.isRemoveProfilePic()) {
            me.setProfilePic(null);
        }

        return UserDto.fullView(userService.updateProfile(me));
    }

    /** Real profile numbers + the user's upcoming trips (hosting or joined). */
    @GetMapping("/users/{userId}/stats")
    public Map<String, Object> stats(@PathVariable String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        LocalDate today = tripClock.today();

        List<Map<String, Object>> upcoming = new ArrayList<>();
        travelService.TravelPlanByUser(user.getEmail()).forEach(plan -> addIfUpcoming(upcoming, plan, "HOST", today));
        joinRequestService.getAcceptedRequestsBySender(user)
                .forEach(request -> addIfUpcoming(upcoming, request.getTravelPlan(), "COMPANION", today));
        upcoming.sort(Comparator.comparing(entry -> ((TravelDto) entry.get("plan")).getStartDate(),
                Comparator.nullsLast(Comparator.naturalOrder())));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("tripsCreated", travelRepo.countByUser(user));
        body.put("tripsJoined", joinRequestService.getAcceptedRequestsBySender(user).size());
        body.put("friends", friendshipService.getFriends(user.getUserId()).size());
        body.put("upcomingTrips", upcoming.size() > 6 ? upcoming.subList(0, 6) : upcoming);
        return body;
    }

    private static void addIfUpcoming(List<Map<String, Object>> list, Travel plan, String role, LocalDate today) {
        TravelDto dto = TravelDto.from(plan);
        // "upcoming" = not finished yet (includes trips that are happening now)
        if (dto.getEndDate() == null || !dto.getEndDate().isBefore(today)) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("role", role);
            entry.put("plan", dto);
            list.add(entry);
        }
    }

    @GetMapping("/static-plans/featured")
    public List<StaticPlan> featuredStaticPlans() {
        return staticPlanService.getFeaturedPlans();
    }
}
