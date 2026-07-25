package com.stc.stc.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stc.stc.repository.UserRepo;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final UserRepo userRepo;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {

        long userCount = userRepo.count();   // Executes a real SQL query

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("database", "UP");
        response.put("timestamp", Instant.now());
        response.put("userCount", userCount);

        return ResponseEntity.ok(response);
    }
}