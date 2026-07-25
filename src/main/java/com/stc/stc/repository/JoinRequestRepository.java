package com.stc.stc.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.stc.stc.entity.JoinRequest;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;

@Repository
public interface JoinRequestRepository extends JpaRepository<JoinRequest, String> {
    List<JoinRequest> findByOwner(User owner);

    List<JoinRequest> findBySender(User sender);

    List<JoinRequest> findByTravelPlan(Travel travelPlan);

    Optional<JoinRequest> findBySenderAndTravelPlan(User sender, Travel travelPlan);

    List<JoinRequest> findByOwnerAndStatus(User owner, String status);

    List<JoinRequest> findByTravelPlanAndStatus(Travel travelPlan, String status);
}