package com.stc.stc.entity;

import java.sql.Date;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKeyColumn;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class Travel {

    @Id
    private String travelId;
    private String destination;

    // Add the new field for day-by-day itinerary
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "travel_day_itineraries", joinColumns = @JoinColumn(name = "travel_id"))
    @MapKeyColumn(name = "day_number")
    @Column(name = "day_itinerary", length = 1000)
    private Map<Integer, String> dayItineraries = new HashMap<>();

    private String interest;
    private String planStatus;

    private Date startDate;
    private Date endDate;
    private Date createdAt;

    // mapping with user
    @ManyToOne
    @JsonIgnore
    private User user;

    @Override
    public String toString() {
        return " Destination: " + destination +
                ", Interest: " + interest +
                ", Start Date: " + startDate +
                ", End Date: " + endDate +
                ", Status: " + planStatus;
    }

}
