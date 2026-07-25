package com.stc.stc.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import com.stc.stc.dto.LoginDetailsDto;
import com.stc.stc.dto.RegistrationDto;
import com.stc.stc.dto.TravelCacheDto;
import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.TravelService;
import com.stc.stc.services.UserService;

import jakarta.servlet.http.HttpSession;

@Controller
public class PageController {

    @Autowired
    private TravelService travelService;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private UserService userService;

    @Autowired
    ImageService imageService;

    @GetMapping("/")
    public String index() {
        return "redirect:/home";
    }

    @GetMapping("/home")
    public String home(Model model) {
        // getAllTravelPlan() now returns cache-safe DTOs; field names match the entity
        // so the home.html template requires no changes.
        List<TravelCacheDto> travelPlans = travelService.getAllTravelPlan();
        model.addAttribute("travelPlans", travelPlans);
        return "home"; // Renders home.html
    }

    @GetMapping("/login")
    public String login(Model model) {
        LoginDetailsDto loginForm = new LoginDetailsDto();
        model.addAttribute("loginForm", loginForm);
        return "login";
    }

    // Not needed as spring security is handling this login stuff
    // @PostMapping("/login")
    // public String login(@ModelAttribute LoginDetailsDto login, HttpSession
    // session) {
    // // Check if user exists in the database
    // User user = userRepo.findByEmail(login.getEmail())
    // .orElseThrow(() -> new IllegalStateException("User not found"));

    // // Validate the password
    // if (!user.getPassword().equals(login.getPassword())) {
    // return "redirect:/login";
    // }

    // // Set user email in session after successful authentication
    // session.setAttribute("userEmail", user.getEmail());

    // return "redirect:/user/dashboard";
    // }

    @GetMapping("/register")
    public String register(Model model) {
        RegistrationDto registerUserForm = new RegistrationDto();
        model.addAttribute("registerUser", registerUserForm);
        return "register";
    }

    @PostMapping("/register")
    public String register(@ModelAttribute RegistrationDto register, HttpSession session) {
        System.out.println("User Registered: " + register.toString());

        User user = new User();
        user.setName(register.getName());
        user.setEmail(register.getEmail());
        user.setPassword(register.getPassword());
        user.setAbout(register.getAbout());
        user.setPhoneNumber(register.getPhoneNumber());
        user.setLanguage(register.getLanguage());
        user.setGender(register.getGender());
        user.setCountry(register.getCountry());
        user.setState(register.getState());
        user.setCity(register.getCity());

        // process image
        if (register.getProfilePic() != null && !register.getProfilePic().isEmpty()) {
            // publicId of the image for cloudinary
            String filename = UUID.randomUUID().toString();
            String fileURL = imageService.uploadImage(register.getProfilePic(), filename);
            user.setProfilePic(fileURL);
        }

        User res = userService.saveUser(user);

        return "redirect:/home";
    }

}
