package com.plateandpantry.service;

import com.plateandpantry.domain.AdminUser;
import com.plateandpantry.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrap {
    private final AdminUserRepository users;
    private final PasswordEncoder encoder;
    private final String username;
    private final String password;
    private final boolean demoEnabled;
    private final String demoUsername;
    private final String demoPassword;
    public AdminBootstrap(
        AdminUserRepository users,
        PasswordEncoder encoder,
        @Value("${app.admin.username}") String username,
        @Value("${app.admin.password}") String password,
        @Value("${app.demo-admin.enabled:false}") boolean demoEnabled,
        @Value("${app.demo-admin.username:}") String demoUsername,
        @Value("${app.demo-admin.password:}") String demoPassword
    ) {
        this.users = users;
        this.encoder = encoder;
        this.username = username;
        this.password = password;
        this.demoEnabled = demoEnabled;
        this.demoUsername = demoUsername;
        this.demoPassword = demoPassword;
    }
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void bootstrap() {
        createUser(username, password, "ADMIN");
        if (demoEnabled) createUser(demoUsername, demoPassword, "DEMO_ADMIN");
    }
    private void createUser(String configuredUsername, String configuredPassword, String prefix) {
        if (configuredUsername.isBlank() && configuredPassword.isBlank()) return;
        if (configuredUsername.isBlank() || configuredPassword.length() < 12) throw new IllegalStateException(prefix + "_USERNAME and a " + prefix + "_PASSWORD of at least 12 characters must be supplied together");
        String normalizedUsername = configuredUsername.trim();
        if (prefix.equals("DEMO_ADMIN") && normalizedUsername.equalsIgnoreCase(username.trim())) throw new IllegalStateException("DEMO_ADMIN_USERNAME must be different from ADMIN_USERNAME");
        if (users.findByUsernameIgnoreCase(normalizedUsername).isPresent()) return;
        AdminUser user = new AdminUser();
        user.setUsername(normalizedUsername);
        user.setPasswordHash(encoder.encode(configuredPassword));
        users.save(user);
    }
}
