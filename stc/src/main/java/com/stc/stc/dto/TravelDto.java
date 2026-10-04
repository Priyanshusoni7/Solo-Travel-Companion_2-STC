package com.stc.stc.dto;

import java.time.LocalDate;
import java.util.Map;
import java.util.TreeMap;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JSON view of a travel plan. Dates are LocalDate so they serialize as "yyyy-MM-dd".
 * The itinerary is a TreeMap so days are always ordered by day number.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TravelDto {

    private String travelId;
    private String destination;
    private Map<Integer, String> dayItineraries;
    private String interest;
    private String planStatus;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate createdAt;
    private UserSummaryDto user;
    private Integer joinedCount;
    private Integer maxCompanions;
    private String coverImageUrl;

    public static TravelDto from(Travel travel) {
        User owner = travel.getUser();
        return TravelDto.builder()
                .travelId(travel.getTravelId())
                .destination(travel.getDestination())
                .dayItineraries(sorted(travel.getDayItineraries()))
                .interest(travel.getInterest())
                .planStatus(travel.getPlanStatus())
                .startDate(toLocal(travel.getStartDate()))
                .endDate(toLocal(travel.getEndDate()))
                .createdAt(toLocal(travel.getCreatedAt()))
                .user(owner == null ? null
                        : UserSummaryDto.builder()
                                .userId(owner.getUserId())
                                .name(owner.getName())
                                .profilePic(owner.getProfilePic())
                                .build())
                .maxCompanions(travel.getMaxCompanions())
                .coverImageUrl(travel.getCoverImageUrl())
                .build();
    }

    /** Maps the Redis-cached explore DTO (kept unchanged so existing cache entries stay valid). */
    public static TravelDto from(TravelCacheDto cached) {
        return TravelDto.builder()
                .travelId(cached.getTravelId())
                .destination(cached.getDestination())
                .dayItineraries(sorted(cached.getDayItineraries()))
                .interest(cached.getInterest())
                .planStatus(cached.getPlanStatus())
                .startDate(toLocal(cached.getStartDate()))
                .endDate(toLocal(cached.getEndDate()))
                .createdAt(toLocal(cached.getCreatedAt()))
                .user(withoutEmail(cached.getUser()))
                .maxCompanions(cached.getMaxCompanions())
                .coverImageUrl(cached.getCoverImageUrl())
                .build();
    }

    /** Other users' e-mail addresses are private; the cached summary still contains it. */
    private static UserSummaryDto withoutEmail(UserSummaryDto user) {
        return user == null ? null
                : UserSummaryDto.builder()
                        .userId(user.getUserId())
                        .name(user.getName())
                        .profilePic(user.getProfilePic())
                        .build();
    }

    private static Map<Integer, String> sorted(Map<Integer, String> itineraries) {
        return itineraries == null ? new TreeMap<>() : new TreeMap<>(itineraries);
    }

    private static LocalDate toLocal(java.sql.Date date) {
        return date == null ? null : date.toLocalDate();
    }
}
