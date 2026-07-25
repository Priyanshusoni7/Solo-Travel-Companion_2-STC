package com.stc.stc.dto;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class LoginDetailsDto {

    private String email;
    private String password;

}
