package com.stc.stc.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import com.stc.stc.services.impl.SecurityCustomUserDetailService;

@Configuration
public class SecurityConfig {

    @Autowired
    private SecurityCustomUserDetailService userDetailsService;

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
        httpSecurity
                .authorizeHttpRequests(authorize -> {
                    // authorize.requestMatchers("/home","/register","/service").permitAll();
                    authorize.requestMatchers("/ws/**").authenticated();
                    authorize.requestMatchers("/user/**").authenticated();
                    authorize.requestMatchers("/api/messages/**").authenticated();
                    authorize.anyRequest().permitAll();
                });

        // when try to access user urls->(access denied)so we need loginPage(sign-up)
        // for this:-
        httpSecurity.formLogin(formLogin -> {

            formLogin.loginPage("/login");

            formLogin.defaultSuccessUrl("/user/profile");
            // formLogin.failureForwardUrl("/login?error=true");
            formLogin.usernameParameter("email");
            formLogin.passwordParameter("password");

            // formLogin.successHandler((request, response, authentication) -> {
            // response.sendRedirect("/user/dashboard");
            // });

        });

        httpSecurity.csrf(csrf -> csrf
                .ignoringRequestMatchers("/ws/**", "/app/**", "/user/friends/**", "/api/messages/**",
                        "/queue/messages/**", "/user/**", "/static-plans/create"));

        // httpSecurity.csrf(AbstractHttpConfigurer::disable);

        httpSecurity.logout(logoutForm -> {
            logoutForm.logoutUrl("/logout");
            // when user logout then redirect to login page
            logoutForm.logoutSuccessUrl("/login?logout=true");
        });

        return httpSecurity.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

}
