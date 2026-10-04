package com.stc.stc.config;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.config.Customizer;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stc.stc.dto.UserDto;
import com.stc.stc.entity.User;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.impl.SecurityCustomUserDetailService;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Same authentication model as before (Spring Security form login, HTTP session, BCrypt,
 * SecurityCustomUserDetailService), adapted for the separately hosted React application:
 *
 * - This application only serves the REST API (/api/**), the STOMP endpoint (/ws) and /health.
 * - CORS allows the configured frontend origin(s) with credentials (session cookie). See WebConfig.
 * - Login is POST /api/auth/login with form fields "email" and "password"; it answers with
 *   JSON (200 + user / 401) instead of redirecting. Logout is POST /api/auth/logout.
 * - Unauthenticated API calls get 401 and forbidden ones 403 (no redirects to a login page).
 * - CSRF protection is ON for every API call. The token is kept in the HTTP session, handed
 *   to the frontend in the X-XSRF-TOKEN response header, and must be sent back in the
 *   X-XSRF-TOKEN request header.
 * - /api/admin/** requires ROLE_ADMIN (and AdminController repeats it with @PreAuthorize).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private SecurityCustomUserDetailService userDetailsService;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;

    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        // url configuration (public urls, secure urls) [Routes manage]
        httpSecurity.cors(Customizer.withDefaults()); // uses the CorsConfigurationSource bean from WebConfig

        httpSecurity
                .authorizeHttpRequests(authorize -> {
                    authorize.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    authorize.requestMatchers("/health", "/actuator/health", "/error").permitAll();
                    authorize.requestMatchers("/api/auth/me", "/api/auth/register").permitAll();
                    authorize.requestMatchers("/api/admin/**").hasRole("ADMIN");
                    authorize.requestMatchers("/ws/**").authenticated();
                    authorize.anyRequest().authenticated();
                });

        httpSecurity.formLogin(formLogin -> {
            // loginPage only stops Spring from generating its own HTML login page; the UI is the React app
            formLogin.loginPage("/login");
            formLogin.loginProcessingUrl("/api/auth/login");
            formLogin.usernameParameter("email");
            formLogin.passwordParameter("password");
            formLogin.successHandler((request, response, authentication) -> {
                // CSRF token is rotated on login; hand the new one to the frontend right away
                CsrfTokenHeaderFilter.writeToken(request, response);
                writeJson(response, HttpStatus.OK, UserDto.fullView((User) authentication.getPrincipal()));
            });
            formLogin.failureHandler((request, response, exception) -> writeJson(response, HttpStatus.UNAUTHORIZED,
                    Map.of("message", exception instanceof DisabledException
                            ? "Your account has been disabled. Please contact an administrator."
                            : "Invalid email or password")));
            formLogin.permitAll();
        });

        httpSecurity.exceptionHandling(exceptions -> {
            exceptions.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED));
            exceptions.accessDeniedHandler((request, response, exception) -> writeJson(response, HttpStatus.FORBIDDEN,
                    Map.of("message", "Access denied")));
        });

        HttpSessionCsrfTokenRepository csrfTokenRepository = new HttpSessionCsrfTokenRepository();
        csrfTokenRepository.setHeaderName(WebConfig.CSRF_HEADER);
        httpSecurity.csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                // plain (non-XOR) token so the value from the response header can be echoed back as-is
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                // SockJS/STOMP transport; the handshake itself still requires an authenticated session
                .ignoringRequestMatchers("/ws/**"));
        httpSecurity.addFilterAfter(new CsrfTokenHeaderFilter(), BasicAuthenticationFilter.class);

        // Re-checks enabled flag and role against the database on every API/WebSocket request
        httpSecurity.addFilterBefore(new ActiveAccountFilter(userRepo), AuthorizationFilter.class);

        httpSecurity.logout(logoutForm -> {
            logoutForm.logoutUrl("/api/auth/logout");
            logoutForm.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.OK));
        });

        return httpSecurity.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    private void writeJson(HttpServletResponse response, HttpStatus status, Object body) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), body);
    }

}
