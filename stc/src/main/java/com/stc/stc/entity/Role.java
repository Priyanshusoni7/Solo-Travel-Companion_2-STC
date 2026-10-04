package com.stc.stc.entity;

/**
 * Application roles. Stored as a string in the {@code user.role} column and exposed to
 * Spring Security as {@code ROLE_USER} / {@code ROLE_ADMIN}.
 */
public enum Role {
    USER,
    ADMIN;

    public String authority() {
        return "ROLE_" + name();
    }
}
