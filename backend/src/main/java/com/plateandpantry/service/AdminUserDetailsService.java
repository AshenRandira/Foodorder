package com.plateandpantry.service;

import com.plateandpantry.domain.AdminUser;
import com.plateandpantry.repository.AdminUserRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {
    private final AdminUserRepository users;
    public AdminUserDetailsService(AdminUserRepository users) { this.users = users; }
    @Override
    public UserDetails loadUserByUsername(String username) {
        AdminUser admin = users.findByUsernameIgnoreCase(username).orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        return User.withUsername(admin.getUsername()).password(admin.getPasswordHash()).roles("ADMIN").disabled(!admin.isActive()).build();
    }
}
