package com.plateandpantry.service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {
    private record Attempt(int failures, Instant blockedUntil) {}
    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();
    public boolean blocked(String key) {
        Attempt attempt = attempts.get(key);
        if (attempt == null) return false;
        if (attempt.blockedUntil() != null && attempt.blockedUntil().isAfter(Instant.now())) return true;
        if (attempt.blockedUntil() != null) attempts.remove(key);
        return false;
    }
    public void failed(String key) {
        attempts.compute(key, (ignored, current) -> {
            int failures = current == null ? 1 : current.failures() + 1;
            return new Attempt(failures, failures >= 5 ? Instant.now().plus(Duration.ofMinutes(15)) : null);
        });
    }
    public void succeeded(String key) { attempts.remove(key); }
}
