package com.stc.stc.entity;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
public class User implements UserDetails {

    @Id
    private String userId;
    @Column(name = "user_name", nullable = false)
    private String name;
    @Column(unique = true, nullable = false)
    private String email;
    @Getter(value = AccessLevel.NONE)
    private String password;

    private String phoneNumber;
    private String gender;

    @Column(length = 1000)
    private String profilePic;

    private String language;

    private String country;
    private String state;
    private String city;
    @Column(length = 1000)
    private String about;

    @Getter(value = AccessLevel.NONE)
    private boolean enabled = true;
    private boolean emailVerified = true;
    private boolean phoneVerified = true;

    // Nullable on purpose: Hibernate (ddl-auto=update) adds this column to the existing
    // table, so rows created before the ADMIN role existed have NULL here. getRole()
    // treats NULL as USER, and RoleMigrationRunner back-fills NULLs on startup.
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    @Getter(value = AccessLevel.NONE)
    @Builder.Default
    private Role role = Role.USER;

    // mapping one user to many travelPlans
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<Travel> travelPlans = new ArrayList<>();

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private List<Message> sentMessages = new ArrayList<>();

    @OneToMany(mappedBy = "recipient", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private List<Message> receivedMessages = new ArrayList<>();

    public String getPassword() {
        return this.password;
    }

    public Role getRole() {
        return this.role == null ? Role.USER : this.role;
    }

    public boolean isAdmin() {
        return getRole() == Role.ADMIN;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(getRole().authority()));
    }

    @Override
    public String getUsername() {
        // returning email bcz->In this project its(email) our username
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.enabled;
    }

}
