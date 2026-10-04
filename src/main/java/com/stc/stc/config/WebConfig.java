package com.stc.stc.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * The React frontend is a separate application on its own origin (e.g. http://localhost:5173
 * in development, its own host in production), so the API must allow cross-origin calls
 * from it - with credentials, because authentication is the HTTP session cookie.
 *
 * Allowed origins come from APP_CORS_ALLOWED_ORIGINS (comma separated; patterns such as
 * https://*.vercel.app are accepted). The same list is used for the WebSocket endpoint.
 */
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class WebConfig {

    /** Response header that carries the CSRF token to the frontend (see CsrfTokenHeaderFilter). */
    public static final String CSRF_HEADER = "X-XSRF-TOKEN";

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    public List<String> allowedOriginPatterns() {
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOriginPatterns());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of(CSRF_HEADER));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/ws/**", config);
        source.registerCorsConfiguration("/health", config);
        return source;
    }
}
