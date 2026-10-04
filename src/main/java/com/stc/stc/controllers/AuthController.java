package com.stc.stc.controllers;

import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stc.stc.dto.RegistrationDto;
import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.UserService;

import lombok.RequiredArgsConstructor;

/**
 * Login and logout are still handled by Spring Security's form login (see SecurityConfig):
 * POST /api/auth/login (email, password as form fields) and POST /api/auth/logout.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    /** At least 8 characters, with at least one letter and one digit. */
    static final Pattern PASSWORD_RULE = Pattern.compile("^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$");
    static final String PASSWORD_RULE_MESSAGE = "Password must be at least 8 characters and contain at least one letter and one number";

    private final UserRepo userRepo;
    private final UserService userService;
    private final ImageService imageService;

    /** Current session's user, or 401. Also used by the SPA on startup to obtain the CSRF cookie. */
    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepo.findByEmail(authentication.getName())
                .map(user -> ResponseEntity.ok(UserDto.fullView(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    /** Same registration logic as the old PageController#register, as multipart JSON API. */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> register(@ModelAttribute RegistrationDto register) {
        if (!StringUtils.hasText(register.getName()) || !StringUtils.hasText(register.getEmail())
                || !StringUtils.hasText(register.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email and password are required");
        }
        // Applies to new accounts only; existing users keep logging in with their current password
        if (!PASSWORD_RULE.matcher(register.getPassword()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_RULE_MESSAGE);
        }
        String email = register.getEmail().trim();
        if (userRepo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = new User();
        user.setName(register.getName());
        user.setEmail(email);
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

        User saved = userService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.fullView(saved));
    }
}
