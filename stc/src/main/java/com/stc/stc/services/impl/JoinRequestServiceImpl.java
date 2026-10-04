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

    private static final Set<String> CAN_REQUEST_AGAIN = Set.of("REJECTED", "LEFT", "REMOVED");

    private final JoinRequestRepository joinRequestRepository;
    private final FriendshipRepository friendshipRepository;

    @Override
    public JoinRequest createJoinRequest(User sender, User owner, Travel travelPlan, String message) {
        // Check if a request already exists
        Optional<JoinRequest> existingRequest = joinRequestRepository.findBySenderAndTravelPlan(sender, travelPlan);

        if (existingRequest.isPresent()) {
            JoinRequest request = existingRequest.get();
            // If it was rejected before (or the user left / was removed), allow to request again
            if (CAN_REQUEST_AGAIN.contains(request.getStatus())) {
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
    public Optional<JoinRequest> findRequest(User user, Travel travelPlan) {
        return joinRequestRepository.findBySenderAndTravelPlan(user, travelPlan);
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

    @Override
    public long countAccepted(Travel travelPlan) {
        return joinRequestRepository.countByTravelPlanAndStatus(travelPlan, "ACCEPTED");
    }

    @Override
    public Map<String, Long> countAcceptedByTravelIds(Collection<String> travelIds) {
        Map<String, Long> counts = new HashMap<>();
        if (travelIds == null || travelIds.isEmpty()) {
            return counts;
        }
        for (Object[] row : joinRequestRepository.countAcceptedByTravelIds(travelIds)) {
            counts.put((String) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    @Override
    public List<JoinRequest> getAcceptedRequestsBySender(User sender) {
        return joinRequestRepository.findBySenderAndStatus(sender, "ACCEPTED");
    }

    @Override
    public void cancelRequest(String requestId, User sender) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));
        if (!request.getSender().getUserId().equals(sender.getUserId())) {
            throw new RuntimeException("You can only cancel your own requests");
        }
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }
        joinRequestRepository.delete(request);
    }

    @Override
    public JoinRequest leaveTrip(Travel travelPlan, User companion) {
        return changeAcceptedStatus(travelPlan, companion, "LEFT", "You are not a companion on this trip");
    }

    @Override
    public JoinRequest removeCompanion(Travel travelPlan, User companion) {
        return changeAcceptedStatus(travelPlan, companion, "REMOVED", "This user is not a companion on this trip");
    }

    private JoinRequest changeAcceptedStatus(Travel travelPlan, User companion, String newStatus, String notMemberMessage) {
        JoinRequest request = joinRequestRepository.findBySenderAndTravelPlan(companion, travelPlan)
                .filter(r -> "ACCEPTED".equals(r.getStatus()))
                .orElseThrow(() -> new RuntimeException(notMemberMessage));
        request.setStatus(newStatus);
        return joinRequestRepository.save(request);
    }
}
