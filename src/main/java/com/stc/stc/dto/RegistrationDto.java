package com.stc.stc.dto;

import org.springframework.web.multipart.MultipartFile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class RegistrationDto {

    private String name;
    private String email;
    private String password;
    private String phoneNumber;
    private String gender;
    private String language;
    private String country;
    private String state;
    private String city;
    private String about;

    private MultipartFile profilePic;

}
