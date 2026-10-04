package com.stc.stc.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.stc.stc.entity.Role;
import com.stc.stc.repository.UserRepo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Runs once on every startup and is idempotent.
 *
 * 1. Back-fills role = USER for users created before the role column existed.
 * 2. Promotes the e-mails listed in APP_ADMIN_EMAILS (comma separated) to ADMIN.
 *    This is how the first admin is created; it never creates accounts or touches
 *    passwords, it only promotes users that have already registered. Removing an
 *    e-mail from the variable does NOT demote that user (use the admin UI for that).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoleMigrationRunner implements ApplicationRunner {

    private final UserRepo userRepo;

    @Value("${app.admin.emails:}")
    private String adminEmails;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int backfilled = userRepo.assignRoleWhereMissing(Role.USER);
        if (backfilled > 0) {
            log.info("Assigned role USER to {} existing user(s) without a role", backfilled);
        }

        Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .forEach(email -> userRepo.findByEmail(email).ifPresentOrElse(user -> {
                    if (!user.isAdmin()) {
                        user.setRole(Role.ADMIN);
                        userRepo.save(user);
                        log.info("Promoted {} to ADMIN (from APP_ADMIN_EMAILS)", email);
                    }
                }, () -> log.warn("APP_ADMIN_EMAILS contains {} but no such user is registered yet", email)));
    }
}
