package com.stc.stc.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
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

}
