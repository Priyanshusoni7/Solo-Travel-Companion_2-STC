package com.stc.stc.dto;

import java.io.Serializable;
import java.sql.Date;
import java.util.HashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A plain, serialization-safe DTO used to cache travel plans in Redis.
 *
 * <p>The core problem with caching raw {@code Travel} entities is that they carry
 * Hibernate-managed proxy objects ({@code PersistentMap} for {@code dayItineraries},
 * a lazily-loaded {@code User} reference with its own lazy collections, etc.).
 * Jackson's {@code activateDefaultTyping} in the Redis config embeds the Hibernate
 * concrete type names into the JSON. Those types cannot be resolved on deserialization
 * outside an active Hibernate session, producing {@code InvalidTypeIdException} and
 * {@code LazyInitializationException} on every cached read.
 *
 * <p>This DTO contains only plain Java types (String, sql.Date, HashMap) — fully
 * serializable and deserializable by Jackson with no Hibernate dependency.
 *
 * <p>Field names deliberately mirror the {@code Travel} entity fields so that
 * existing Thymeleaf templates require no changes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelCacheDto implements Serializable {

    private static final long serialVersionUID = 1L;

    // Mirrors Travel.travelId
    private String travelId;

    // Mirrors Travel.destination
    private String destination;

    // Mirrors Travel.dayItineraries — stored as a plain HashMap (not a PersistentMap)
    @Builder.Default
    private Map<Integer, String> dayItineraries = new HashMap<>();

    // Mirrors Travel.interest
    private String interest;

    // Mirrors Travel.planStatus
    private String planStatus;

    // Mirrors Travel.startDate
    private Date startDate;

    // Mirrors Travel.endDate
    private Date endDate;

    // Mirrors Travel.createdAt
    private Date createdAt;

    /**
     * Lightweight snapshot of the travel plan owner.
     * Mirrors the fields accessed via {@code travel.user.*} in templates,
     * without carrying lazy collections or framework interface implementations.
     */
    private UserSummaryDto user;

    // Added later: entries cached before these fields existed simply deserialize them as null
    private Integer maxCompanions;

    private String coverImageUrl;
}
