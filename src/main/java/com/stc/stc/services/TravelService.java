package com.stc.stc.services;

import java.util.List;

import com.stc.stc.dto.TravelCacheDto;
import com.stc.stc.entity.Travel;

public interface TravelService {

    void saveTravelPlan(Travel travel);

    public List<Travel> TravelPlanByUser(String email);

    /**
     * Returns all travel plans as cache-safe DTOs.
     * Results are cached in Redis under the "exploreTrips" cache.
     */
    public List<TravelCacheDto> getAllTravelPlan();

    public List<Travel> searchTravels(String keyword);

    Travel getTravelPlanById(String travelId);

    public void updateTravelPlan(Travel travelPlan);

    /** Deletes a plan together with its join requests (used by admin moderation). */
    void deleteTravelPlan(String travelId);

    /** Sets OPEN plans whose start date is on/before `today` to CLOSED; returns how many changed. */
    int closeStartedPlans(java.time.LocalDate today);

}
