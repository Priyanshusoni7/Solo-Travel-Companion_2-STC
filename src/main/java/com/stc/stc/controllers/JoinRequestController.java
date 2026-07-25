package com.stc.stc.controllers;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.stc.stc.entity.JoinRequest;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.helper.Helper;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.JoinRequestService;
import com.stc.stc.services.TravelService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class JoinRequestController {

    private final JoinRequestService joinRequestService;
    private final TravelService travelService;
    private final UserRepo userRepo;

    @PostMapping("/user/travel/join/{id}")
    public String sendJoinRequest(
            @PathVariable String id,
            @RequestParam(required = false) String message,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        
        // Get current user
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        
        // Get travel plan
        Travel travelPlan = travelService.getTravelPlanById(id);
        if (travelPlan == null) {
            redirectAttributes.addFlashAttribute("error", "Travel plan not found");
            return "redirect:/user/dashboard";
        }
        
        // Get plan owner
        User planOwner = travelPlan.getUser();
        
        // Cannot join your own plan
        if (planOwner.getUserId().equals(currentUser.getUserId())) {
            redirectAttributes.addFlashAttribute("error", "You cannot join your own travel plan");
            return "redirect:/user/travel/public/view/" + id;
        }
        
        // Create join request
        joinRequestService.createJoinRequest(currentUser, planOwner, travelPlan, message);
        
        redirectAttributes.addFlashAttribute("success", "Join request sent successfully");
        return "redirect:/user/travel/public/view/" + id;
    }
    
    @GetMapping("/user/requests/pending")
    public String viewPendingRequests(Model model, Authentication authentication) {
        // Get current user
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        
        // Get pending requests for current user
        List<JoinRequest> pendingRequests = joinRequestService.getPendingRequestsForOwner(currentUser);
        
        model.addAttribute("pendingRequests", pendingRequests);
        return "user/pendingRequests";
    }
    
    @PostMapping("/user/requests/respond/{id}")
    public String respondToJoinRequest(
            @PathVariable String id,
            @RequestParam String action,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        
        // Get current user
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        
        // Check action is valid
        if (!action.equals("ACCEPTED") && !action.equals("REJECTED")) {
            redirectAttributes.addFlashAttribute("error", "Invalid action");
            return "redirect:/user/requests/pending";
        }
        
        // Update request status
        try {
            joinRequestService.updateRequestStatus(id, action);
            redirectAttributes.addFlashAttribute("success", 
                    action.equals("ACCEPTED") ? "Request accepted successfully" : "Request rejected");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Failed to update request: " + e.getMessage());
        }
        
        return "redirect:/user/requests/pending";
    }
    
    @GetMapping("/user/requests/sent")
    public String viewSentRequests(Model model, Authentication authentication) {
        // Get current user
        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User currentUser = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        
        // Get requests sent by current user
        List<JoinRequest> sentRequests = joinRequestService.getRequestsBySender(currentUser);
        
        model.addAttribute("sentRequests", sentRequests);
        return "user/sentRequests";
    }

}
