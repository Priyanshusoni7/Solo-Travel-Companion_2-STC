package com.stc.stc.services;

import java.util.List;

import com.stc.stc.entity.StaticPlan;

public interface StaticPlanService {
    List<StaticPlan> getAllStaticPlans();

    List<StaticPlan> getFeaturedPlans();

    StaticPlan saveStaticPlan(StaticPlan staticPlan);

    StaticPlan getStaticPlanById(String staticPlanId);

    void deleteStaticPlan(String staticPlanId);
}
