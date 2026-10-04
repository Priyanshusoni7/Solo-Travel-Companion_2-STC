package com.stc.stc.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.dto.JoinRequestDto;
import com.stc.stc.entity.JoinRequest;
import com.stc.stc.entity.User;
import com.stc.stc.helper.CurrentUser;
import com.stc.stc.repository.JoinRequestRepository;
import com.stc.stc.services.JoinRequestService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class JoinRequestController {

    private final JoinRequestService joinRequestService;
    private final JoinRequestRepository joinRequestRepository;
    private final CurrentUser currentUser;

    /** Pending join requests for plans owned by the current user. */
    @GetMapping("/pending")
    public List<JoinRequestDto> pending(Authentication authentication) {
        User me = currentUser.require(authentication);
        return joinRequestService.getPendingRequestsForOwner(me).stream().map(JoinRequestDto::from).toList();
    }

    /** Requests sent by the current user. */
    @GetMapping("/sent")
    public List<JoinRequestDto> sent(Authentication authentication) {
        User me = currentUser.require(authentication);
        return joinRequestService.getRequestsBySender(me).stream().map(JoinRequestDto::from).toList();
    }

    /** body: {"action": "ACCEPTED" | "REJECTED"} */
    @PostMapping("/{id}/respond")
    public Map<String, String> respond(@PathVariable String id, @RequestBody Map<String, String> body,
            Authentication authentication) {
        User me = currentUser.require(authentication);
        String action = body.get("action");

        // Check action is valid
        if (!"ACCEPTED".equals(action) && !"REJECTED".equals(action)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid action");
        }

        // Only the owner of the travel plan may answer a join request
        JoinRequest request = joinRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Join request not found"));
        if (!request.getOwner().getUserId().equals(me.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only respond to requests for your own plans");
        }

        // Respect the plan's maximum number of companions
        Integer max = request.getTravelPlan().getMaxCompanions();
        if ("ACCEPTED".equals(action) && !"ACCEPTED".equals(request.getStatus()) && max != null
                && joinRequestService.countAccepted(request.getTravelPlan()) >= max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This trip is full (" + max + " companions). Increase the limit or remove a companion first.");
        }

        joinRequestService.updateRequestStatus(id, action);
        return Map.of("message", action.equals("ACCEPTED") ? "Request accepted successfully" : "Request rejected");
    }

    /** The sender withdraws a request that is still pending. */
    @PostMapping("/{id}/cancel")
    public Map<String, String> cancel(@PathVariable String id, Authentication authentication) {
        User me = currentUser.require(authentication);
        joinRequestService.cancelRequest(id, me);
        return Map.of("message", "Join request cancelled");
    }
}
