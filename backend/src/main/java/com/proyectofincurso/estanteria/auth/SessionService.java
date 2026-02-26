package com.proyectofincurso.estanteria.auth;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {

    public record SessionUser(String userName, String role, Instant createdAt) {
    }

    private final Map<String, SessionUser> sessionsByToken = new ConcurrentHashMap<>();

    public String createSession(AuthUser user) {
        String token = UUID.randomUUID().toString();
        sessionsByToken.put(token, new SessionUser(user.userName(), user.role(), Instant.now()));
        return token;
    }

    public SessionUser getSessionOrNull(String token) {
        return sessionsByToken.get(token);
    }
}