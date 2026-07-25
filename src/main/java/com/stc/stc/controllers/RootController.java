package com.stc.stc.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import com.stc.stc.entity.User;
import com.stc.stc.helper.Helper;
import com.stc.stc.repository.UserRepo;

//This Method will run for 'Every Request'
@ControllerAdvice
public class RootController {

    @Autowired
    private UserRepo userRepo;

    // This Method will run for 'Every Request'
    @ModelAttribute
    public void addLoggedInUserInformation(Model model, Authentication authentication) {

        if (authentication == null) {
            return;
        }

        String userEmail = Helper.getEmailOfLoggedInUser(authentication);
        User user = userRepo.findByEmail(userEmail).orElseThrow(() -> new IllegalStateException("User not found"));

        model.addAttribute("loggedInUser", user);
    }

}
