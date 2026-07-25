package com.stc.stc.dto;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A lightweight, serialization-safe DTO representing the essential user fields
 * needed when displaying travel plan cards in the Explore/Dashboard view.
 *
 * This exists specifically to avoid caching the full Hibernate-managed {@code User}
 * entity (which implements {@code UserDetails} and carries lazy collections) in Redis.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private String userId;
    private String name;
    private String email;
    private String profilePic;
}
