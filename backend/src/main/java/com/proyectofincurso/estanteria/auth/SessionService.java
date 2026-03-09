package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.web.error.ApiException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {

    public record SessionUser(String userName, String email, String role, Instant createdAt) {
    }

    private final Map<String, SessionUser> sessionsByToken = new ConcurrentHashMap<>();

    public String createSession(AuthUser user) {
        String token = UUID.randomUUID().toString();
        sessionsByToken.put(
                token,
                new SessionUser(
                        user.userName(),
                        user.email(),
                        user.role(),
                        Instant.now()
                )
        );
        return token;
    }

    public SessionUser getSessionOrNull(String token) {
        return sessionsByToken.get(token);
    }

    public SessionUser getRequiredSession(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        SessionUser session = sessionsByToken.get(token);

        if (session == null) {
            throw ApiException.unauthorized(
                    "INVALID_SESSION",
                    "La sesión no es válida o ha expirado"
            );
        }

        return session;
    }

    public void updateSessionUser(String authorizationHeader, String userName, String email, String role) {
        String token = extractBearerToken(authorizationHeader);
        SessionUser current = sessionsByToken.get(token);

        if (current == null) {
            throw ApiException.unauthorized(
                    "INVALID_SESSION",
                    "La sesión no es válida o ha expirado"
            );
        }

        sessionsByToken.put(
                token,
                new SessionUser(
                        userName,
                        email,
                        role,
                        current.createdAt()
                )
        );
    }

    public void invalidateSession(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        sessionsByToken.remove(token);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw ApiException.unauthorized(
                    "MISSING_AUTHORIZATION",
                    "Falta la cabecera Authorization"
            );
        }

        String prefix = "Bearer ";
        if (!authorizationHeader.startsWith(prefix)) {
            throw ApiException.unauthorized(
                    "INVALID_AUTHORIZATION_FORMAT",
                    "La cabecera Authorization debe usar el formato Bearer <token>"
            );
        }

        String token = authorizationHeader.substring(prefix.length()).trim();
        if (token.isEmpty()) {
            throw ApiException.unauthorized(
                    "INVALID_AUTHORIZATION_TOKEN",
                    "El token de sesión es obligatorio"
            );
        }

        return token;
    }
}