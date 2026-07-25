package com.stc.stc.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "join_requests")
public class JoinRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String requestId;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne
    @JoinColumn(name = "travel_id", nullable = false)
    private Travel travelPlan;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED

    @Column(length = 500)
    private String message;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
