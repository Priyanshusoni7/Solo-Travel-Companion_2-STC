package com.stc.stc.config;

import java.io.IOException;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * The frontend runs on a different origin, so it cannot read a CSRF cookie set by this API.
 * Instead every API response carries the current CSRF token in the X-XSRF-TOKEN response
 * header (exposed via CORS only to the allowed frontend origins). The frontend keeps the
 * latest value and sends it back in the X-XSRF-TOKEN request header on POST/PUT/PATCH/DELETE.
 * The token itself is stored server-side in the HTTP session.
 */
final class CsrfTokenHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        writeToken(request, response);
        filterChain.doFilter(request, response);
    }

    static void writeToken(HttpServletRequest request, HttpServletResponse response) {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            response.setHeader(WebConfig.CSRF_HEADER, csrfToken.getToken());
        }
    }
}
