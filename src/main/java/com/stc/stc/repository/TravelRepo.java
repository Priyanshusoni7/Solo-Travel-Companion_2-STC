package com.stc.stc.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;

@Repository
public interface TravelRepo extends JpaRepository<Travel, String> {

    List<Travel> findByUser(User user);

    @Query("SELECT t FROM Travel t WHERE " +
            "LOWER(t.destination) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Travel> searchTravels(@Param("keyword") String keyword);

    // ---- Admin ----

    Page<Travel> findByDestinationContainingIgnoreCase(String destination, Pageable pageable);

    long countByPlanStatus(String planStatus);

    long countByUser(User user);

    /** Auto-close: OPEN plans whose start date has been reached become CLOSED. Nothing else changes. */
    @Modifying
    @Query("UPDATE Travel t SET t.planStatus = 'CLOSED' WHERE t.planStatus = 'OPEN' AND t.startDate <= :today")
    int closePlansStartedOnOrBefore(@Param("today") java.sql.Date today);

}
