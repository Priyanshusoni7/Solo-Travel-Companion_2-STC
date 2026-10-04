package com.stc.stc.helper;

import org.springframework.security.core.Authentication;

public class Helper {

    public static String getEmailOfLoggedInUser(Authentication authentication) {

        return authentication.getName();
    }
}
