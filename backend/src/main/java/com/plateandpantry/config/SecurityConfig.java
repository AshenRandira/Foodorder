package com.plateandpantry.config;

import com.plateandpantry.service.AdminUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean AuthenticationManager authenticationManager(AdminUserDetailsService users, PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }
    @Bean SecurityContextRepository securityContextRepository() { return new HttpSessionSecurityContextRepository(); }
    @Bean CorsConfigurationSource corsConfigurationSource(@Value("${app.frontend-origins}") String origins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN", "Idempotency-Key"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, @Qualifier("corsConfigurationSource") CorsConfigurationSource cors, SecurityContextRepository repository, ObjectMapper mapper) throws Exception {
        CookieCsrfTokenRepository csrf = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrf.setCookiePath("/");
        http
            .cors(c -> c.configurationSource(cors))
            .csrf(c -> c.csrfTokenRepository(csrf).ignoringRequestMatchers("/api/orders/**", "/api/payments/payhere/notify"))
            .securityContext(c -> c.securityContextRepository(repository))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/menu/**", "/api/orders/**", "/api/csrf", "/api/admin/auth/session").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders", "/api/admin/auth/login", "/api/payments/payhere/notify").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().denyAll())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, error) -> writeSecurityError(res, mapper, 401, "AUTHENTICATION_REQUIRED", "Admin authentication is required."))
                .accessDeniedHandler((req, res, error) -> writeSecurityError(res, mapper, 403, "ACCESS_DENIED", "The request was denied.")))
            .sessionManagement(session -> session.sessionFixation(fixation -> fixation.migrateSession()))
            .formLogin(c -> c.disable())
            .httpBasic(c -> c.disable());
        return http.build();
    }
    private void writeSecurityError(HttpServletResponse response, ObjectMapper mapper, int status, String code, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getWriter(), java.util.Map.of("status", status, "code", code, "message", message));
    }
}
