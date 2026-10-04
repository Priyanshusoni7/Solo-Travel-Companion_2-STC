package com.stc.stc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.stc.stc.config.SecurityConfig;
import com.stc.stc.config.WebConfig;
import com.stc.stc.controllers.ApiExceptionHandler;
import com.stc.stc.controllers.FriendshipController;
import com.stc.stc.controllers.JoinRequestController;
import com.stc.stc.controllers.TravelController;
import com.stc.stc.dto.TravelCacheDto;
import com.stc.stc.entity.Friendship;
import com.stc.stc.entity.JoinRequest;
import com.stc.stc.entity.Role;
import com.stc.stc.entity.Travel;
import com.stc.stc.entity.User;
import com.stc.stc.helper.CurrentUser;
import com.stc.stc.helper.TripClock;
import com.stc.stc.repository.JoinRequestRepository;
import com.stc.stc.repository.UserRepo;
import com.stc.stc.services.FriendshipService;
import com.stc.stc.services.ImageService;
import com.stc.stc.services.JoinRequestService;
import com.stc.stc.services.TravelService;
import com.stc.stc.services.impl.SecurityCustomUserDetailService;

/** Business rules of the travel-plan features (join guards, capacity, auto-close, filters, ownership). */
@WebMvcTest(controllers = { TravelController.class, JoinRequestController.class, FriendshipController.class })
@Import({ SecurityConfig.class, WebConfig.class, ApiExceptionHandler.class, CurrentUser.class, TripClock.class })
@TestPropertySource(properties = { "app.cors.allowed-origins=http://localhost:5173", "app.timezone=Asia/Kolkata" })
class TravelFeaturesTest {

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("Asia/Kolkata"));

    @Autowired private MockMvc mvc;

    @MockitoBean private UserRepo userRepo;
    @MockitoBean private SecurityCustomUserDetailService userDetailsService;
    @MockitoBean private TravelService travelService;
    @MockitoBean private JoinRequestService joinRequestService;
    @MockitoBean private JoinRequestRepository joinRequestRepository;
    @MockitoBean private FriendshipService friendshipService;
    @MockitoBean private ImageService imageService;

    private User owner;
    private User traveler;

    @BeforeEach
    void users() {
        owner = user("owner@test.com");
        traveler = user("traveler@test.com");
    }

    private User user(String email) {
        User u = new User();
        u.setUserId(email);
        u.setName(email);
        u.setEmail(email);
        u.setPassword("x");
        u.setRole(Role.USER);
        u.setEnabled(true);
        when(userRepo.findByEmail(email)).thenReturn(Optional.of(u));
        when(userRepo.findById(email)).thenReturn(Optional.of(u));
        return u;
    }

    private static UsernamePasswordAuthenticationToken as(User u) {
        return UsernamePasswordAuthenticationToken.authenticated(u, null, u.getAuthorities());
    }

    private Travel plan(String id, String status, LocalDate start, Integer max, long accepted) {
        Travel t = new Travel();
        t.setTravelId(id);
        t.setDestination("Goa");
        t.setPlanStatus(status);
        t.setStartDate(Date.valueOf(start));
        t.setEndDate(Date.valueOf(start.plusDays(3)));
        t.setMaxCompanions(max);
        t.setUser(owner);
        when(travelService.getTravelPlanById(id)).thenReturn(t);
        when(joinRequestService.countAccepted(t)).thenReturn(accepted);
        return t;
    }

    private void expectJoinRejected(String planId, String message) throws Exception {
        mvc.perform(post("/api/travel/" + planId + "/join").with(authentication(as(traveler))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString(message)));
    }

    @Test
    void joinIsRejectedForClosedStartedAndFullPlans() throws Exception {
        plan("closed", "CLOSED", TODAY.plusDays(10), null, 0);
        plan("started", "OPEN", TODAY, null, 0);
        plan("full", "OPEN", TODAY.plusDays(10), 2, 2);

        expectJoinRejected("closed", "not accepting companions");
        expectJoinRejected("started", "already started");
        expectJoinRejected("full", "full");
        verify(joinRequestService, never()).createJoinRequest(any(), any(), any(), any());
    }

    @Test
    void joinWorksForOpenFuturePlanWithFreeSeats() throws Exception {
        Travel t = plan("open", "OPEN", TODAY.plusDays(10), 3, 1);
        JoinRequest created = JoinRequest.builder().status("PENDING").build();
        when(joinRequestService.createJoinRequest(eq(traveler), eq(owner), eq(t), any())).thenReturn(created);

        mvc.perform(post("/api/travel/open/join").with(authentication(as(traveler))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"hi\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void savingAPlanThatAlreadyStartedForcesClosed() throws Exception {
        String body = "{\"destination\":\"Goa\",\"startDate\":\"" + TODAY + "\",\"endDate\":\"" + TODAY.plusDays(2)
                + "\",\"interest\":\"Adventure\",\"planStatus\":\"OPEN\",\"dayItineraries\":{\"1\":\"Beach\"}}";
        mvc.perform(post("/api/travel").with(authentication(as(owner))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planStatus").value("CLOSED"));

        String future = body.replace(TODAY.toString(), TODAY.plusDays(5).toString())
                .replace(TODAY.plusDays(2).toString(), TODAY.plusDays(7).toString());
        mvc.perform(post("/api/travel").with(authentication(as(owner))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(future))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.planStatus").value("OPEN"));
    }

    @Test
    void invalidMaxCompanionsIsRejected() throws Exception {
        String body = "{\"destination\":\"Goa\",\"startDate\":\"" + TODAY.plusDays(5) + "\",\"endDate\":\""
                + TODAY.plusDays(7) + "\",\"maxCompanions\":0}";
        mvc.perform(post("/api/travel").with(authentication(as(owner))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void exploreFiltersAndPaginates() throws Exception {
        TravelCacheDto ended = cached("ended", "OPEN", TODAY.minusDays(10), TODAY.minusDays(5), "Culture", null);
        TravelCacheDto closed = cached("closed", "CLOSED", TODAY.plusDays(5), TODAY.plusDays(8), "Adventure", null);
        TravelCacheDto open = cached("open", "OPEN", TODAY.plusDays(5), TODAY.plusDays(8), "Adventure", 4);
        TravelCacheDto fullPlan = cached("full", "OPEN", TODAY.plusDays(5), TODAY.plusDays(8), "Food", 1);
        when(travelService.getAllTravelPlan()).thenReturn(List.of(ended, closed, open, fullPlan));
        when(joinRequestService.countAcceptedByTravelIds(anyCollection())).thenReturn(Map.of("full", 1L, "open", 2L));

        // default: ended trips hidden
        mvc.perform(get("/api/travel").with(authentication(as(traveler))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.page.totalElements").value(3));
        // open only: not CLOSED, not full
        mvc.perform(get("/api/travel").param("openOnly", "true").with(authentication(as(traveler))))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].travelId").value("open"))
                .andExpect(jsonPath("$.content[0].joinedCount").value(2))
                .andExpect(jsonPath("$.content[0].maxCompanions").value(4));
        // interest filter + include ended
        mvc.perform(get("/api/travel").param("interest", "culture").param("hideEnded", "false")
                .with(authentication(as(traveler))))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].travelId").value("ended"));
        // pagination
        mvc.perform(get("/api/travel").param("size", "2").param("page", "1").with(authentication(as(traveler))))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.page.totalPages").value(2));
    }

    private TravelCacheDto cached(String id, String status, LocalDate start, LocalDate end, String interest, Integer max) {
        return TravelCacheDto.builder().travelId(id).destination(id).planStatus(status).interest(interest)
                .startDate(Date.valueOf(start)).endDate(Date.valueOf(end)).createdAt(Date.valueOf(TODAY))
                .maxCompanions(max).build();
    }

    @Test
    void onlyTheOwnerCanDeleteAPlan() throws Exception {
        plan("p1", "OPEN", TODAY.plusDays(5), null, 0);
        mvc.perform(delete("/api/travel/p1").with(authentication(as(traveler))).with(csrf()))
                .andExpect(status().isForbidden());
        verify(travelService, never()).deleteTravelPlan("p1");

        mvc.perform(delete("/api/travel/p1").with(authentication(as(owner))).with(csrf()))
                .andExpect(status().isNoContent());
        verify(travelService).deleteTravelPlan("p1");
    }

    @Test
    void ownerCannotAcceptWhenTripIsFull() throws Exception {
        Travel t = plan("p2", "OPEN", TODAY.plusDays(5), 1, 1);
        JoinRequest request = JoinRequest.builder().requestId("r1").owner(owner).sender(traveler)
                .travelPlan(t).status("PENDING").build();
        when(joinRequestRepository.findById("r1")).thenReturn(Optional.of(request));

        mvc.perform(post("/api/requests/r1/respond").with(authentication(as(owner))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"action\":\"ACCEPTED\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("full")));
        verify(joinRequestService, never()).updateRequestStatus(any(), any());

        // rejecting is still possible
        mvc.perform(post("/api/requests/r1/respond").with(authentication(as(owner))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"action\":\"REJECTED\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void ownerRemovesCompanionAndCompanionLeaves() throws Exception {
        Travel t = plan("p3", "OPEN", TODAY.plusDays(5), null, 1);
        mvc.perform(post("/api/travel/p3/companions/traveler@test.com/remove").with(authentication(as(traveler))).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/travel/p3/companions/traveler@test.com/remove").with(authentication(as(owner))).with(csrf()))
                .andExpect(status().isOk());
        verify(joinRequestService).removeCompanion(t, traveler);

        mvc.perform(post("/api/travel/p3/leave").with(authentication(as(traveler))).with(csrf()))
                .andExpect(status().isOk());
        verify(joinRequestService).leaveTrip(t, traveler);
    }

    @Test
    void friendshipStatusTellsWhoSentTheRequest() throws Exception {
        Friendship pending = new Friendship(7L, owner, traveler, "pending", TODAY);
        when(friendshipService.findFriendship("traveler@test.com", "owner@test.com")).thenReturn(pending);
        when(friendshipService.findFriendship("owner@test.com", "traveler@test.com")).thenReturn(pending);

        mvc.perform(get("/api/friends/status/owner@test.com").with(authentication(as(traveler))))
                .andExpect(jsonPath("$.status").value("PENDING_RECEIVED"))
                .andExpect(jsonPath("$.friendshipId").value(7));
        mvc.perform(get("/api/friends/status/traveler@test.com").with(authentication(as(owner))))
                .andExpect(jsonPath("$.status").value("PENDING_SENT"));
    }

    @Test
    void cannotFriendYourself() throws Exception {
        mvc.perform(post("/api/friends/request").with(authentication(as(traveler))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"recipientId\":\"traveler@test.com\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void savedPlanKeepsCoverAndCapacity() throws Exception {
        Travel t = plan("p4", "OPEN", TODAY.plusDays(5), 5, 0);
        t.setCoverImageUrl("https://img/cover.jpg");
        String body = "{\"destination\":\"Goa\",\"startDate\":\"" + TODAY.plusDays(5) + "\",\"endDate\":\""
                + TODAY.plusDays(7) + "\",\"planStatus\":\"OPEN\",\"maxCompanions\":3}";
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/travel/p4")
                .with(authentication(as(owner))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coverImageUrl").value("https://img/cover.jpg"))
                .andExpect(jsonPath("$.maxCompanions").value(3));
        ArgumentCaptor<Travel> saved = ArgumentCaptor.forClass(Travel.class);
        verify(travelService).updateTravelPlan(saved.capture());
        org.junit.jupiter.api.Assertions.assertEquals("OPEN", saved.getValue().getPlanStatus());
    }
}
