package com.stc.stc.dto;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import lombok.Data;

/** Request body for creating / updating a travel plan from the React frontend. */
@Data
public class TravelPlanRequest {

    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private String interest;
    private String planStatus;
    private Integer maxCompanions; // optional; null = unlimited
    private Map<Integer, String> dayItineraries = new HashMap<>();

    /** Same rule the old form handler applied: drop blank days. */
    public Map<Integer, String> cleanedItineraries() {
        Map<Integer, String> cleaned = new HashMap<>();
        if (dayItineraries != null) {
            dayItineraries.forEach((day, text) -> {
                if (day != null && text != null && !text.trim().isEmpty()) {
                    cleaned.put(day, text);
                }
            });
        }
        return cleaned;
    }
}
