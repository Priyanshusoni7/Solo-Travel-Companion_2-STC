package com.stc.stc.services.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.stc.stc.entity.StaticPlan;
import com.stc.stc.repository.StaticPlanRepository;
import com.stc.stc.services.StaticPlanService;

@Service
public class StaticPlanServiceImpl implements StaticPlanService {

    @Autowired
    private StaticPlanRepository staticPlanRepository;

    @Override
    public List<StaticPlan> getAllStaticPlans() {
        return staticPlanRepository.findAll();
    }

    @Override
    public List<StaticPlan> getFeaturedPlans() {
        return staticPlanRepository.findByFeaturedTrue();
    }

    @Override
    public StaticPlan saveStaticPlan(StaticPlan staticPlan) {
        return staticPlanRepository.save(staticPlan);
    }

}
