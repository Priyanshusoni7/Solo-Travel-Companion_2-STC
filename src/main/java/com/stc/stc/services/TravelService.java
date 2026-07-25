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

}
