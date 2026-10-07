package com.plateandpantry;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminAuthorizationTest {
    @Autowired MockMvc mvc;

    @Test void anonymousAdminRequestIsRejected() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
    }

    @Test @WithMockUser(roles = "ADMIN")
    void authenticatedAdminCanReadDashboard() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isOk()).andExpect(jsonPath("$.totalOrders").value(0));
    }

    @Test @WithMockUser(roles = "ADMIN")
    void adminMutationRequiresCsrfToken() throws Exception {
        String body = "{\"name\":\"Dinner\",\"slug\":\"dinner\",\"active\":true,\"sortOrder\":1}";
        mvc.perform(post("/api/admin/categories").contentType("application/json").content(body)).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/categories").with(csrf()).contentType("application/json").content(body)).andExpect(status().isCreated());
    }
}
