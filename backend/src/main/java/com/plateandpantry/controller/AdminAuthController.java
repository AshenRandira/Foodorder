package com.plateandpantry.controller;

import com.plateandpantry.dto.AdminDtos.*;
import com.plateandpantry.error.BusinessException;
import com.plateandpantry.service.LoginAttemptService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final LoginAttemptService attempts;
    public AdminAuthController(AuthenticationManager authenticationManager, SecurityContextRepository contextRepository, LoginAttemptService attempts) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.attempts = attempts;
    }
    @PostMapping("/login")
    public SessionView login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        String key = request.getRemoteAddr() + ":" + body.username().toLowerCase();
        if (attempts.blocked(key)) throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "LOGIN_RATE_LIMITED", "Too many failed attempts. Try again in 15 minutes.");
        try {
            Authentication authentication = authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(body.username(), body.password()));
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            request.getSession(true);
            contextRepository.saveContext(context, request, response);
            attempts.succeeded(key);
            return new SessionView(true, authentication.getName());
        } catch (AuthenticationException ex) {
            attempts.failed(key);
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Username or password is incorrect.");
        }
    }
    @GetMapping("/session")
    public SessionView session(Authentication authentication) {
        boolean authenticated = authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName());
        return new SessionView(authenticated, authenticated ? authentication.getName() : null);
    }
    @PostMapping("/logout")
    public SessionView logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return new SessionView(false, null);
    }
}
