package com.stc.stc.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    long countByStatus(String status);

    long countByTravelPlanAndStatus(Travel travelPlan, String status);

    long countBySenderAndStatus(User sender, String status);

    List<JoinRequest> findBySenderAndStatus(User sender, String status);

    /** [travelId, acceptedCount] rows for many plans in one query (Explore feed). */
    @Query("SELECT jr.travelPlan.travelId, COUNT(jr) FROM JoinRequest jr "
            + "WHERE jr.status = 'ACCEPTED' AND jr.travelPlan.travelId IN :travelIds GROUP BY jr.travelPlan.travelId")
    List<Object[]> countAcceptedByTravelIds(@Param("travelIds") Collection<String> travelIds);
}