package com.stc.stc.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import com.stc.stc.entity.StaticPlan;
import com.stc.stc.entity.User;
import com.stc.stc.dto.TravelCacheDto;
import com.stc.stc.helper.Helper;
import com.stc.stc.services.StaticPlanService;
import com.stc.stc.services.TravelService;
import com.stc.stc.services.UserService;

@Controller
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private TravelService travelService;

    @Autowired
    private StaticPlanService staticPlanService;

    @RequestMapping("/dashboard")
    public String dashboard(Model model, Authentication authentication) {

        // getAllTravelPlan() returns cache-safe DTOs; field names mirror the entity
        // so dashboard.html requires no changes.
        List<TravelCacheDto> travelPlans = travelService.getAllTravelPlan();
        model.addAttribute("travelPlans", travelPlans);

        List<StaticPlan> featuredStaticPlans = staticPlanService.getFeaturedPlans();
        model.addAttribute("featuredStaticPlans", featuredStaticPlans);
        return "user/dashboard";
    }

    @RequestMapping("/profile")
    public String profile(Model model, Authentication authentication) {

        String UserEmail = Helper.getEmailOfLoggedInUser(authentication);
        User user = userService.profile(UserEmail); // Fetch user profile via service
        model.addAttribute("user", user);
        return "user/profile";
    }
}
