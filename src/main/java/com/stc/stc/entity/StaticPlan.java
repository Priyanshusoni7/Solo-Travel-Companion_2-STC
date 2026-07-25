package com.stc.stc.entity;

import java.util.Date;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "static_plan")
public class StaticPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String staticPlanId;

    private String title;
    private String destination;
    private String description;
    private String imageUrl;
    private Date startDate;
    private Date endDate;
    private Double price;
    private String planType; // e.g., "Adventure", "Luxury", "Budget"
    private Boolean featured;
    private Integer maxParticipants;
    private Integer currentParticipants;

    @CreationTimestamp
    private Date createdAt;
}
