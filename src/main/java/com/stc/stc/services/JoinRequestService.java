package com.stc.stc.services;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import com.stc.stc.entity.*;

public interface JoinRequestService {

    JoinRequest createJoinRequest(User sender, User owner, Travel travelPlan, String message);

    JoinRequest updateRequestStatus(String requestId, String status);

    List<JoinRequest> getPendingRequestsForOwner(User owner);

    List<JoinRequest> getRequestsBySender(User sender);

    boolean hasUserRequestedToJoin(User user, Travel travelPlan);

    String getRequestStatus(User user, Travel travelPlan);

    java.util.Optional<JoinRequest> findRequest(User user, Travel travelPlan);

    List<JoinRequest> getAcceptedRequestsForTravel(Travel travelPlan);

    long countAccepted(Travel travelPlan);

    /** travelId -> number of accepted companions (plans without any are absent). */
    Map<String, Long> countAcceptedByTravelIds(Collection<String> travelIds);

    /** Accepted requests sent by the user = trips they have joined. */
    List<JoinRequest> getAcceptedRequestsBySender(User sender);

    /** Sender withdraws a PENDING request (the row is deleted; nothing had happened yet). */
    void cancelRequest(String requestId, User sender);

    /** An accepted companion leaves the trip (status ACCEPTED -> LEFT, the row is kept). */
    JoinRequest leaveTrip(Travel travelPlan, User companion);

    /** The plan owner removes an accepted companion (status ACCEPTED -> REMOVED, the row is kept). */
    JoinRequest removeCompanion(Travel travelPlan, User companion);
}
