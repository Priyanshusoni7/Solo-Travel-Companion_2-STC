package com.stc.stc.services.impl;

import java.time.LocalDate;
import java.util.*;

import org.springframework.stereotype.Service;

import com.stc.stc.entity.Friendship;
import com.stc.stc.entity.JoinRequest;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.repository.FriendshipRepository;
import com.stc.stc.repository.JoinRequestRepository;
import com.stc.stc.services.JoinRequestService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JoinRequestServiceImpl implements JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final FriendshipRepository friendshipRepository;

    @Override
    public JoinRequest createJoinRequest(User sender, User owner, Travel travelPlan, String message) {
        // Check if a request already exists
        Optional<JoinRequest> existingRequest = joinRequestRepository.findBySenderAndTravelPlan(sender, travelPlan);

        if (existingRequest.isPresent()) {
            JoinRequest request = existingRequest.get();
            // If it was rejected before, allow to request again by updating status
            if ("REJECTED".equals(request.getStatus())) {
                request.setStatus("PENDING");
                request.setMessage(message);
                return joinRequestRepository.save(request);
            }
            return request; // Return existing request without changes
        }

        // Create new request if none exists
        JoinRequest newRequest = JoinRequest.builder()
                .sender(sender)
                .owner(owner)
                .travelPlan(travelPlan)
                .status("PENDING")
                .message(message)
                .build();

        return joinRequestRepository.save(newRequest);
    }

    @Override
    public JoinRequest updateRequestStatus(String requestId, String status) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        request.setStatus(status);

        // If request is accepted, create friendship
        if ("ACCEPTED".equals(status)) {
            createFriendship(request.getSender(), request.getOwner());
        }

        return joinRequestRepository.save(request);
    }

    private void createFriendship(User user1, User user2) {
        // Check if friendship already exists
        boolean friendshipExists = friendshipRepository.findFriendshipBetweenUsers(user1, user2).isPresent() ||
                friendshipRepository.findFriendshipBetweenUsers(user2, user1).isPresent();

        if (!friendshipExists) {
            Friendship friendship = new Friendship();
            friendship.setUser1(user1);
            friendship.setUser2(user2);
            friendship.setStatus("accepted");
            friendship.setCreatedAt(LocalDate.now());

            friendshipRepository.save(friendship);
        }
    }

    @Override
    public List<JoinRequest> getPendingRequestsForOwner(User owner) {
        return joinRequestRepository.findByOwnerAndStatus(owner, "PENDING");
    }

    public List<JoinRequest> getRequestsBySender(User sender) {
        return joinRequestRepository.findBySender(sender);
    }

    @Override
    public boolean hasUserRequestedToJoin(User user, Travel travelPlan) {
        Optional<JoinRequest> request = joinRequestRepository.findBySenderAndTravelPlan(user, travelPlan);
        return request.isPresent();
    }

    @Override
    public String getRequestStatus(User user, Travel travelPlan) {
        Optional<JoinRequest> request = joinRequestRepository.findBySenderAndTravelPlan(user, travelPlan);
        return request.map(JoinRequest::getStatus).orElse(null);
    }

    @Override
    public List<JoinRequest> getAcceptedRequestsForTravel(Travel travelPlan) {
        return joinRequestRepository.findByTravelPlanAndStatus(travelPlan, "ACCEPTED");
    }
}
