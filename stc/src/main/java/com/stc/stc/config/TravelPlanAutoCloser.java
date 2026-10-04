package com.stc.stc.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.stc.stc.helper.TripClock;
import com.stc.stc.services.TravelService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Travel plans stop accepting companions once the trip starts: OPEN plans whose start date has
 * been reached are switched to CLOSED (on startup and every 15 minutes, in APP_TIMEZONE).
 * Only planStatus changes; join requests, accepted companions, itineraries etc. are untouched.
 * The join endpoint also checks the start date itself, so nothing slips through between runs.
 */
@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class TravelPlanAutoCloser {

    private final TravelService travelService;
    private final TripClock tripClock;

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        closeStartedPlans();
    }

    @Scheduled(cron = "0 */15 * * * *", zone = "${app.timezone:Asia/Kolkata}")
    public void closeStartedPlans() {
        try {
            int closed = travelService.closeStartedPlans(tripClock.today());
            if (closed > 0) {
                log.info("Auto-closed {} travel plan(s) whose start date has been reached", closed);
            }
        } catch (RuntimeException e) {
            // never let a failed run (e.g. DB hiccup) stop the scheduler or the startup
            log.warn("Auto-closing started travel plans failed: {}", e.getMessage());
        }
    }
}
