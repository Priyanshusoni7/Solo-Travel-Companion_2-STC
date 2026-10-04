package com.stc.stc.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.stc.stc.entity.Role;
import com.stc.stc.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JSON view of a {@link User}. Never expose the entity itself: it implements UserDetails
 * and its public getPassword() would leak the password hash.
 *
 * Null fields are omitted, so {@link #publicView(User)} (what other users see) simply
 * leaves out private fields: e-mail, phone number, role and account status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {

    private String userId;
    private String name;
    private String profilePic;
    private String gender;
    private String language;
    private String country;
    private String state;
    private String city;
    private String about;

    // Private fields: only for the user themself and for admins
    private String email;
    private String phoneNumber;
    private Role role;
    private Boolean enabled;

    public static UserDto publicView(User user) {
        if (user == null) {
            return null;
        }
        return UserDto.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .profilePic(user.getProfilePic())
                .gender(user.getGender())
                .language(user.getLanguage())
                .country(user.getCountry())
                .state(user.getState())
                .city(user.getCity())
                .about(user.getAbout())
                .build();
    }

    public static UserDto fullView(User user) {
        UserDto dto = publicView(user);
        if (dto != null) {
            dto.setEmail(user.getEmail());
            dto.setPhoneNumber(user.getPhoneNumber());
            dto.setRole(user.getRole());
            dto.setEnabled(user.isEnabled());
        }
        return dto;
    }
}
