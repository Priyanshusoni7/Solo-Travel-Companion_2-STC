package com.stc.stc.services;

import java.util.List;

import com.stc.stc.entity.*;

public interface JoinRequestService {

    JoinRequest createJoinRequest(User sender, User owner, Travel travelPlan, String message);

    JoinRequest updateRequestStatus(String requestId, String status);

    List<JoinRequest> getPendingRequestsForOwner(User owner);

    List<JoinRequest> getRequestsBySender(User sender);

    boolean hasUserRequestedToJoin(User user, Travel travelPlan);

    String getRequestStatus(User user, Travel travelPlan);

    List<JoinRequest> getAcceptedRequestsForTravel(Travel travelPlan);
}
