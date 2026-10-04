package com.stc.stc.dto;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

/** Multipart form for PUT /api/users/me. E-mail (login name) and password are not editable here. */
@Data
public class ProfileUpdateDto {

    private String name;
    private String phoneNumber;
    private String gender;
    private String language;
    private String country;
    private String state;
    private String city;
    private String about;

    private MultipartFile profilePic; // optional new photo
    private boolean removeProfilePic; // true = go back to the default avatar
}
