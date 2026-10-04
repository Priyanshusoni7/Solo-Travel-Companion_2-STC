package com.stc.stc.services.impl;

import java.sql.Date;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stc.stc.dto.TravelCacheDto;
import com.stc.stc.dto.UserSummaryDto;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.repository.JoinRequestRepository;
import com.stc.stc.repository.TravelRepo;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.TravelService;

@Service
public class TravelServiceImpl implements TravelService {

    @Autowired
    private TravelRepo travelRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JoinRequestRepository joinRequestRepository;

    @Autowired
    private CacheManager cacheManager;


    // cache — evict exploreTrips when a new plan is created
    @Override
    @CacheEvict(value = "exploreTrips", allEntries = true)
    public void saveTravelPlan(Travel travel) {

        String TravelId = UUID.randomUUID().toString();
        travel.setTravelId(TravelId);

        travel.setCreatedAt(new Date(System.currentTimeMillis()));

        travelRepo.save(travel);

    }

    @Override
    public List<Travel> TravelPlanByUser(String email) {

        User user = userRepo.findByEmail(email).orElseThrow(() -> new IllegalStateException("User not found"));

        List<Travel> travelPlans = travelRepo.findByUser(user);

        return travelPlans;
    }


    /**
     * Returns all travel plans as serialization-safe {@link TravelCacheDto} objects.
     *
     * <p>Raw Hibernate entities are intentionally NOT cached because they carry
     * Hibernate proxy types ({@code PersistentMap}, {@code PersistentBag}) and the
     * {@code User} entity implements Spring Security's {@code UserDetails} with lazy
     * collections. Jackson's type-embedding in Redis encodes those proxy class names,
     * which cannot be resolved on deserialization outside a Hibernate session —
     * causing {@code InvalidTypeIdException} / {@code LazyInitializationException}
     * on every cache hit.
     *
     * <p>By mapping to DTOs (plain Java types only) before caching, Redis stores and
     * restores them cleanly with no session dependency.
     */
    @Override
    @Cacheable(value = "exploreTrips")
    public List<TravelCacheDto> getAllTravelPlan() {
        return travelRepo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<Travel> searchTravels(String keyword) {

        return travelRepo.searchTravels(keyword);
    }

    @Override
    public Travel getTravelPlanById(String travelId) {
        return travelRepo.findById(travelId)
                .orElseThrow(() -> new IllegalStateException("Travel Plan not found with id: " + travelId));
    }

    // cache — evict exploreTrips when a plan is updated
    @Override
    @CacheEvict(value = "exploreTrips", allEntries = true)
    public void updateTravelPlan(Travel travelPlan) {
        if (travelRepo.existsById(travelPlan.getTravelId())) {
            travelRepo.save(travelPlan);
        } else {
            throw new IllegalArgumentException("Travel plan not found!");
        }
    }

    // cache — evict exploreTrips when a plan is deleted
    @Override
    @Transactional
    @CacheEvict(value = "exploreTrips", allEntries = true)
    public void deleteTravelPlan(String travelId) {
        Travel travel = getTravelPlanById(travelId);
        // join_requests.travel_id references the plan, so remove those rows first
        joinRequestRepository.deleteAll(joinRequestRepository.findByTravelPlan(travel));
        travelRepo.delete(travel);
    }

    @Override
    @Transactional
    public int closeStartedPlans(java.time.LocalDate today) {
        int closed = travelRepo.closePlansStartedOnOrBefore(Date.valueOf(today));
        if (closed > 0) {
            // the explore cache holds plan statuses
            Cache cache = cacheManager.getCache("exploreTrips");
            if (cache != null) {
                cache.clear();
            }
        }
        return closed;
    }

    // -------------------------------------------------------------------------
    // Private mapping helpers
    // -------------------------------------------------------------------------

    /**
     * Maps a Hibernate-managed {@link Travel} entity to a cache-safe {@link TravelCacheDto}.
     *
     * <p>All collection fields are copied into plain Java collections so that no
     * Hibernate proxy object ever enters the cache.
     */
    private TravelCacheDto toDto(Travel travel) {
        UserSummaryDto userSummary = null;
        if (travel.getUser() != null) {
            User u = travel.getUser();
            userSummary = UserSummaryDto.builder()
                    .userId(u.getUserId())
                    .name(u.getName())
                    .email(u.getEmail())
                    .profilePic(u.getProfilePic())
                    .build();
        }

        // Copy dayItineraries into a plain HashMap — never a PersistentMap
        HashMap<Integer, String> plainItineraries = new HashMap<>();
        if (travel.getDayItineraries() != null) {
            plainItineraries.putAll(travel.getDayItineraries());
        }

        return TravelCacheDto.builder()
                .travelId(travel.getTravelId())
                .destination(travel.getDestination())
                .dayItineraries(plainItineraries)
                .interest(travel.getInterest())
                .planStatus(travel.getPlanStatus())
                .startDate(travel.getStartDate())
                .endDate(travel.getEndDate())
                .createdAt(travel.getCreatedAt())
                .user(userSummary)
                .maxCompanions(travel.getMaxCompanions())
                .coverImageUrl(travel.getCoverImageUrl())
                .build();
    }
}

