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
    public AdminBootstrap(AdminUserRepository users, PasswordEncoder encoder, @Value("${app.admin.username}") String username, @Value("${app.admin.password}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.username = username;
        this.password = password;
    }
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void bootstrap() {
        if (username.isBlank() && password.isBlank()) return;
        if (username.isBlank() || password.length() < 12) throw new IllegalStateException("ADMIN_USERNAME and an ADMIN_PASSWORD of at least 12 characters must be supplied together");
        if (users.findByUsernameIgnoreCase(username).isPresent()) return;
        AdminUser user = new AdminUser();
        user.setUsername(username.trim());
        user.setPasswordHash(encoder.encode(password));
        users.save(user);
    }
}
