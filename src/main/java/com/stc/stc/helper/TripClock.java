package com.stc.stc.helper;

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * "Today" for travel-plan rules (auto-close at start date, upcoming trips, hide ended trips).
 * Plans only store a date, so the time zone decides when a day starts; it defaults to India
 * (APP_TIMEZONE) instead of the server's zone, which is usually UTC on hosting platforms.
 */
@Component
public class TripClock {

    private final ZoneId zone;

    public TripClock(@Value("${app.timezone:Asia/Kolkata}") String zone) {
        this.zone = ZoneId.of(zone);
    }

    public LocalDate today() {
        return LocalDate.now(zone);
    }

    public ZoneId zone() {
        return zone;
    }
}
