package com.stc.stc.entity;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "friendship")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long friendshipId;
    
    @ManyToOne
    @JoinColumn(name = "user_id_1", nullable = false)
    private User user1;
    
    @ManyToOne
    @JoinColumn(name = "user_id_2", nullable = false)
    private User user2;
    
    @Column(nullable = false, length = 30)
    private String status; // pending, accepted, blocked
    
    @Column(nullable = false)
    private LocalDate createdAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDate.now();
    }

}
