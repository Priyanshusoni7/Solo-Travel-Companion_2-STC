package com.stc.stc.dto;

import java.sql.Date;
import java.util.HashMap;
import java.util.Map;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class TravelPostDto {

    private String destination;
    @Builder.Default
    private Map<Integer, String> dayItineraries = new HashMap<Integer, String>();
    private String interest;
    private String planStatus;
    private Date startDate;
    private Date endDate;

}
