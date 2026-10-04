package com.stc.stc.config;

import java.io.IOException;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * The logged-in User is stored in the HTTP session at login time, so without this filter an
 * admin's changes (disable account, grant/revoke ADMIN) would only apply after the affected
 * user logs in again. For API and WebSocket requests this filter reloads the user:
 *
 * - account deleted or disabled  -> session is invalidated, request continues as anonymous (401)
 * - otherwise                     -> authorities for this request come from the current DB role
 */
final class ActiveAccountFilter extends OncePerRequestFilter {

    private final UserRepo userRepo;

    ActiveAccountFilter(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !(path.startsWith("/api/") || path.startsWith("/ws"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof User sessionUser) {
            Optional<User> current = userRepo.findByEmail(sessionUser.getEmail());

            if (current.isEmpty() || !current.get().isEnabled()) {
                SecurityContextHolder.clearContext();
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }
            } else {
                User user = current.get();
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                        user, authentication.getCredentials(), user.getAuthorities()));
                SecurityContextHolder.setContext(context);
            }
        }

        filterChain.doFilter(request, response);
    }
}
