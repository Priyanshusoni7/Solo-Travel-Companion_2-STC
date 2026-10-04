package com.stc.stc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.stc.stc.config.SecurityConfig;
import com.stc.stc.config.WebConfig;
import com.stc.stc.controllers.AdminController;
import com.stc.stc.controllers.ApiExceptionHandler;
import com.stc.stc.controllers.AuthController;
import com.stc.stc.entity.Role;
import com.stc.stc.entity.User;
import com.stc.stc.helper.CurrentUser;
import com.stc.stc.repository.CommunityMessageRepository;
import com.stc.stc.repository.TravelRepo;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.AdminService;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.JoinRequestService;
import com.stc.stc.services.StaticPlanService;
import com.stc.stc.services.TravelService;
import com.stc.stc.services.UserService;
import com.stc.stc.services.impl.SecurityCustomUserDetailService;

/**
 * Verifies the security rules with the real SecurityConfig filter chain (no server, database or Redis):
 * role checks, CSRF via the X-XSRF-TOKEN header, CORS for the separate frontend origin and JSON login.
 */
@WebMvcTest(controllers = { AdminController.class, AuthController.class })
@Import({ SecurityConfig.class, WebConfig.class, ApiExceptionHandler.class, CurrentUser.class })
@TestPropertySource(properties = "app.cors.allowed-origins=http://localhost:5173")
class SecurityConfigTest {

    private static final String FRONTEND = "http://localhost:5173";

    @Autowired
    private MockMvc mvc;

    @MockitoBean private UserRepo userRepo;
    @MockitoBean private SecurityCustomUserDetailService userDetailsService;
    @MockitoBean private AdminService adminService;
    @MockitoBean private TravelService travelService;
    @MockitoBean private JoinRequestService joinRequestService;
    @MockitoBean private StaticPlanService staticPlanService;
    @MockitoBean private ImageService imageService;
    @MockitoBean private TravelRepo travelRepo;
    @MockitoBean private CommunityMessageRepository communityMessageRepository;
    @MockitoBean private UserService userService;

    private User user(String email, Role role, boolean enabled) {
        User u = new User();
        u.setUserId(email);
        u.setName(email);
        u.setEmail(email);
        u.setPassword(new BCryptPasswordEncoder().encode("secret"));
        u.setRole(role);
        u.setEnabled(enabled);
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(u));
        return u;
    }

    private static UsernamePasswordAuthenticationToken auth(User u) {
        return UsernamePasswordAuthenticationToken.authenticated(u, null, u.getAuthorities());
    }

    @Test
    void adminApiRequiresLogin() throws Exception {
        mvc.perform(get("/api/admin/stats")).andExpect(status().isUnauthorized());
    }

    @Test
    void normalUserCannotCallAdminApi() throws Exception {
        User bob = user("bob@test.com", Role.USER, true);
        mvc.perform(get("/api/admin/stats").with(authentication(auth(bob)))).andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/users/x/role").with(authentication(auth(bob))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCallAdminApi() throws Exception {
        User alice = user("alice@test.com", Role.ADMIN, true);
        when(adminService.getStats()).thenReturn(Map.of("users", 2L));
        mvc.perform(get("/api/admin/stats").with(authentication(auth(alice))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").value(2));
    }

    @Test
    void revokedAdminLosesAccessImmediately() throws Exception {
        // Session still holds an ADMIN principal, but the database now says USER
        User stale = user("carol@test.com", Role.ADMIN, true);
        User fresh = user("carol@test.com", Role.USER, true);
        when(userRepo.findByEmail("carol@test.com")).thenReturn(Optional.of(fresh));
        mvc.perform(get("/api/admin/stats").with(authentication(auth(stale)))).andExpect(status().isForbidden());
    }

    @Test
    void disabledUserIsLoggedOut() throws Exception {
        User active = user("dave@test.com", Role.ADMIN, true);
        User disabled = user("dave@test.com", Role.ADMIN, false);
        when(userRepo.findByEmail("dave@test.com")).thenReturn(Optional.of(disabled));
        mvc.perform(get("/api/admin/stats").with(authentication(auth(active)))).andExpect(status().isUnauthorized());
    }

    @Test
    void writesWithoutCsrfTokenAreRejected() throws Exception {
        User alice = user("alice@test.com", Role.ADMIN, true);
        mvc.perform(patch("/api/admin/users/x/status").with(authentication(auth(alice)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());
    }

    // Fresh context: other tests use the csrf() post-processor, which permanently wraps the CSRF
    // repository of the cached filter chain and would reject the real token used here.
    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
    void csrfTokenFromResponseHeaderIsAcceptedAndLoginReturnsJson() throws Exception {
        User erin = user("erin@test.com", Role.USER, true);
        when(userDetailsService.loadUserByUsername("erin@test.com")).thenReturn(erin);

        MockHttpSession session = new MockHttpSession();
        MvcResult me = mvc.perform(get("/api/auth/me").session(session).header("Origin", FRONTEND))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("X-XSRF-TOKEN"))
                .andExpect(header().string("Access-Control-Allow-Origin", FRONTEND))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                .andExpect(header().string("Access-Control-Expose-Headers", containsString("X-XSRF-TOKEN")))
                .andReturn();
        String token = me.getResponse().getHeader("X-XSRF-TOKEN");

        mvc.perform(post("/api/auth/login").session(session).header("X-XSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("email", "erin@test.com").param("password", "wrong"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        mvc.perform(post("/api/auth/login").session(session).header("X-XSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("email", "erin@test.com").param("password", "secret"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("erin@test.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(header().exists("X-XSRF-TOKEN"));
    }

    @Test
    void disabledAccountCannotLogIn() throws Exception {
        User frank = user("frank@test.com", Role.USER, false);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(frank);
        mvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("email", "frank@test.com").param("password", "secret"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("disabled")));
    }

    @Test
    void corsPreflightAllowsOnlyConfiguredFrontend() throws Exception {
        mvc.perform(options("/api/travel").header("Origin", FRONTEND).header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", FRONTEND))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        mvc.perform(options("/api/travel").header("Origin", "https://evil.example").header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void registrationAssignsNoAdminAndRejectsDuplicates() throws Exception {
        when(userRepo.existsByEmail("dup@test.com")).thenReturn(true);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/auth/register")
                .param("name", "Dup").param("email", "dup@test.com").param("password", "secret123").with(csrf()))
                .andExpect(status().isConflict());

        // password rule: 8+ characters with a letter and a number
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/auth/register")
                .param("name", "Weak").param("email", "weak@test.com").param("password", "abcdefgh").with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("at least 8 characters")));

        when(userRepo.existsByEmail("new@test.com")).thenReturn(false);
        when(userService.saveUser(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setRole(Role.USER);
            return u;
        });
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/auth/register")
                .param("name", "New").param("email", "new@test.com").param("password", "secret123").param("role", "ADMIN")
                .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("USER"));
    }
}
