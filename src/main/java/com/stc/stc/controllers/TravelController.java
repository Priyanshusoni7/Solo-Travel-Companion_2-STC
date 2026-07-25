package com.stc.stc.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.stc.stc.dto.TravelPostDto;
import com.stc.stc.entity.JoinRequest;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.helper.Helper;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.JoinRequestService;
import com.stc.stc.services.TravelService;

@Controller
@RequestMapping("/user/travel")
public class TravelController {

    @Autowired
    private TravelService travelService;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JoinRequestService joinRequestService;

    // add travel plan form
    @GetMapping("/post")
    public String post(Model model) {
        TravelPostDto travelPlan = new TravelPostDto();
        model.addAttribute("travelPlan", travelPlan);
        return "user/postTravelPlan";
    }

    // add travel plan
    // @PostMapping("/add")
    // public String post(@ModelAttribute TravelPostDto travel, Authentication
    // authentication) {
    // Travel plan = new Travel();

    // String userEmail = Helper.getEmailOfLoggedInUser(authentication);
    // User user = userRepo.findByEmail(userEmail).orElseThrow(() -> new
    // IllegalStateException("User not found"));

    // plan.setDestination(travel.getDestination());
    // plan.setItinerary(travel.getItinerary());
    // plan.setInterest(travel.getInterest());
    // plan.setPlanStatus(travel.getPlanStatus());
    // plan.setStartDate(travel.getStartDate());
    // plan.setEndDate(travel.getEndDate());
    // plan.setUser(user);

    // travelService.saveTravelPlan(plan);

    // return "redirect:/user/travel/myplans";
    // }

    @PostMapping("/add")
    public String post(@ModelAttribute TravelPostDto travelPostDto,
            @RequestParam Map<String, String> requestParams,
            Authentication authentication) {

        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Travel plan = new Travel();
        plan.setDestination(travelPostDto.getDestination());
        plan.setInterest(travelPostDto.getInterest());
        plan.setPlanStatus(travelPostDto.getPlanStatus());
        plan.setStartDate(travelPostDto.getStartDate());
        plan.setEndDate(travelPostDto.getEndDate());
        plan.setUser(user);

        // Process the day-by-day itineraries
        Map<Integer, String> dayItineraries = new HashMap<>();
        for (String key : requestParams.keySet()) {
            if (key.startsWith("dayItineraries[") && key.endsWith("]")) {
                String dayNumberStr = key.substring(15, key.length() - 1);
                try {
                    Integer dayNumber = Integer.parseInt(dayNumberStr);
                    String dayItinerary = requestParams.get(key);
                    if (dayItinerary != null && !dayItinerary.trim().isEmpty()) {
                        dayItineraries.put(dayNumber, dayItinerary);
                    }
                } catch (NumberFormatException e) {
                    // Skip if day number is not an integer
                }
            }
        }
        plan.setDayItineraries(dayItineraries);

        // Let the service handle ID generation and timestamp
        travelService.saveTravelPlan(plan);

        return "redirect:/user/travel/myplans";
    }

    // all travel paln display
    @RequestMapping("/alltravelpost")
    public String alltravelpost() {

        String userEmail = Helper.getEmailOfLoggedInUser(null);
        List<Travel> travelPlans = travelService.TravelPlanByUser(userEmail);

        return "All travel plans:\n" + travelPlans.stream()
                .map(Travel::toString) // Assuming `Travel` has a `toString()` method
                .collect(Collectors.joining("\n"));
    }

    @GetMapping("/myplans")
    public String myplans(Model model, Authentication authentication) {

        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        List<Travel> travelPlans = travelService.TravelPlanByUser(userEmail); // Fetch plans from service

        // joined counts for each plan
        Map<String, Integer> joinedCounts = new HashMap<>();
        for (Travel plan : travelPlans) {
            List<JoinRequest> acceptedRequests = joinRequestService.getAcceptedRequestsForTravel(plan);
            joinedCounts.put(plan.getTravelId(), acceptedRequests.size());
        }

        model.addAttribute("joinedCounts", joinedCounts);
        model.addAttribute("travelPlans", travelPlans);
        return "user/myplans";
    }

    // Both public and private plan view method (any user caan see the plans details
    // from dashboard)
    @GetMapping("/public/view/{id}")
    public String viewPublicTravelPlan(@PathVariable String id, Model model, Authentication authentication) {
        // Get the travel plan by ID
        Travel travelPlan = travelService.getTravelPlanById(id);

        // Check if the plan exists
        if (travelPlan == null) {
            return "redirect:/user/dashboard";
        }

        // Add current user info for potential "Join" functionality
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Add plan owner information for display
        User planOwner = travelPlan.getUser();

        // Check if user has already sent a join request for this plan
        String requestStatus = joinRequestService.getRequestStatus(currentUser, travelPlan);

        List<JoinRequest> acceptedRequests = joinRequestService.getAcceptedRequestsForTravel(travelPlan);
        List<User> joinedUsers = acceptedRequests.stream()
                .map(JoinRequest::getSender)
                .collect(Collectors.toList());

        model.addAttribute("joinedUsers", joinedUsers);
        model.addAttribute("joinedCount", joinedUsers.size());
        model.addAttribute("plan", travelPlan);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("planOwner", planOwner);
        model.addAttribute("isOwner", planOwner.getUserId().equals(currentUser.getUserId()));
        model.addAttribute("requestStatus", requestStatus);

        return "user/viewTravelPlan"; // You can either create a new template or modify existing one
    }

    // view UI for editing travel plan
    @GetMapping("/edit/{id}")
    public String editTravelPlan(@PathVariable String id, Model model, Authentication authentication) {
        Travel travelPlan = travelService.getTravelPlanById(id);

        // Check if user owns this plan
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User user = userRepo.findByEmail(userEmail).orElseThrow(() -> new IllegalStateException("User not found"));

        if (travelPlan == null || !travelPlan.getUser().getUserId().equals(user.getUserId())) {
            return "redirect:/user/travel/myplans?error=unauthorized";
        }

        model.addAttribute("travelPlan", travelPlan);
        return "user/editTravelPlan";
    }

    @PostMapping("/update/{id}")
    public String updateTravelPlan(@PathVariable String id,
            @ModelAttribute Travel updatedPlan,
            @RequestParam Map<String, String> requestParams,
            Authentication authentication) {
        Travel existingPlan = travelService.getTravelPlanById(id);

        // Check if user owns this plan
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User user = userRepo.findByEmail(userEmail).orElseThrow(() -> new IllegalStateException("User not found"));

        if (existingPlan == null || !existingPlan.getUser().getUserId().equals(user.getUserId())) {
            return "redirect:/user/travel/myplans?error=unauthorized";
        }

        // Update the plan fields
        existingPlan.setDestination(updatedPlan.getDestination());
        existingPlan.setInterest(updatedPlan.getInterest());
        existingPlan.setPlanStatus(updatedPlan.getPlanStatus());
        existingPlan.setStartDate(updatedPlan.getStartDate());
        existingPlan.setEndDate(updatedPlan.getEndDate());

        // Process the day-by-day itineraries
        Map<Integer, String> dayItineraries = new HashMap<>();
        for (String key : requestParams.keySet()) {
            if (key.startsWith("dayItineraries[") && key.endsWith("]")) {
                String dayNumberStr = key.substring(15, key.length() - 1);
                try {
                    Integer dayNumber = Integer.parseInt(dayNumberStr);
                    String dayItinerary = requestParams.get(key);
                    if (dayItinerary != null && !dayItinerary.trim().isEmpty()) {
                        dayItineraries.put(dayNumber, dayItinerary);
                    }
                } catch (NumberFormatException e) {
                    // Skip if day number is not an integer
                }
            }
        }
        existingPlan.setDayItineraries(dayItineraries);

        travelService.updateTravelPlan(existingPlan);

        return "redirect:/user/travel/myplans";
    }

    @GetMapping("/my-joined-users")
    public String viewMyJoinedUsers(Model model, Authentication authentication) {
        // Get current user
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Get all travel plans created by this user
        List<Travel> myPlans = travelService.TravelPlanByUser(currentUser.getEmail());

        // For each plan, get accepted join requests
        Map<Travel, List<User>> planJoinedUsers = new HashMap<>();
        for (Travel plan : myPlans) {
            List<JoinRequest> acceptedRequests = joinRequestService.getAcceptedRequestsForTravel(plan);
            List<User> joinedUsers = acceptedRequests.stream()
                    .map(JoinRequest::getSender)
                    .collect(Collectors.toList());
            planJoinedUsers.put(plan, joinedUsers);
        }

        model.addAttribute("planJoinedUsers", planJoinedUsers);
        return "user/myJoinedUsers";
    }
}