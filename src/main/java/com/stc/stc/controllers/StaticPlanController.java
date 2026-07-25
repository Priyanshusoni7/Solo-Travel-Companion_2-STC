package com.stc.stc.controllers;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import com.stc.stc.entity.StaticPlan;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.StaticPlanService;

@Controller
@RequestMapping("/static-plans")
public class StaticPlanController {

    @Autowired
    private StaticPlanService staticPlanService;

    @Autowired
    private ImageService imageService;

    @GetMapping
    public String getAllStaticPlans(Model model) {
        List<StaticPlan> staticPlans = staticPlanService.getAllStaticPlans();
        model.addAttribute("staticPlans", staticPlans);
        return "static-plans/list";
    }

    @GetMapping("/featured")
    public String getFeaturedPlans(Model model) {
        List<StaticPlan> featuredPlans = staticPlanService.getFeaturedPlans();
        model.addAttribute("featuredPlans", featuredPlans);
        return "static-plans/featured";
    }

    // uplodaing static plan from postman..
    @PostMapping("/create")
    public ResponseEntity<?> createStaticPlan(
            @RequestParam("title") String title,
            @RequestParam("destination") String destination,
            @RequestParam("description") String description,
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr,
            @RequestParam("price") Double price,
            @RequestParam("planType") String planType,
            @RequestParam(value = "featured", required = false, defaultValue = "false") Boolean featured,
            @RequestParam("maxParticipants") Integer maxParticipants,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            // Create StaticPlan object
            StaticPlan staticPlan = new StaticPlan();
            staticPlan.setTitle(title);
            staticPlan.setDestination(destination);
            staticPlan.setDescription(description);

            staticPlan.setPrice(price);
            staticPlan.setPlanType(planType);
            staticPlan.setFeatured(featured);
            staticPlan.setMaxParticipants(maxParticipants);
            staticPlan.setCurrentParticipants(0); // Initial participants

            // Convert String to LocalDate
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDateLocal = LocalDate.parse(startDateStr, formatter);
            LocalDate endDateLocal = LocalDate.parse(endDateStr, formatter);

            // Convert LocalDate to Date
            Date startDate = Date.from(startDateLocal.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date endDate = Date.from(endDateLocal.atStartOfDay(ZoneId.systemDefault()).toInstant());

            staticPlan.setStartDate(startDate);
            staticPlan.setEndDate(endDate);

            // Handle image upload
            if (image != null && !image.isEmpty()) {
                // Generate unique filename
                String filename = "static_plan_" + UUID.randomUUID().toString();

                // Upload image to Cloudinary
                String imageUrl = imageService.uploadImage(image, filename);

                // Set image URL to the static plan
                staticPlan.setImageUrl(imageUrl);
            }

            // Save the static plan
            StaticPlan savedStaticPlan = staticPlanService.saveStaticPlan(staticPlan);

            return ResponseEntity.ok(savedStaticPlan);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating static plan: " + e.getMessage());
        }
    }

}
