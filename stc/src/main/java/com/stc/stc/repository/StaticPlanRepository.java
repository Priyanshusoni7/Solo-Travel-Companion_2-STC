package com.stc.stc.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.stc.stc.entity.StaticPlan;

@Repository
public interface StaticPlanRepository extends JpaRepository<StaticPlan, String> {
    List<StaticPlan> findByFeaturedTrue();

    long countByFeaturedTrue();
}
