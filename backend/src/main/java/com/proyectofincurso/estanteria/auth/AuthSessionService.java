package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.AuthSession;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.AuthSessionRepository;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private final AuthSessionRepository authSessionRepository;
    private final UserAccountRepository userAccountRepository;

    @Value("${security.jwt.expiration-minutes}")
    private long expirationMinutes;

    @Transactional
    public AuthSession crearSesion(AuthUser authUser) {
        UserAccount user = userAccountRepository.findById(authUser.userId())
                .orElseThrow(() -> ApiException.unauthorized(
                        "AUTH_USER_NOT_FOUND",
                        "No se pudo crear la sesión autenticada"
                ));

        Instant now = Instant.now();
        AuthSession session = new AuthSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setUserAccount(user);
        session.setCreatedAt(now);
        session.setExpiresAt(now.plus(expirationMinutes, ChronoUnit.MINUTES));

        return authSessionRepository.save(session);
    }

    @Transactional
    public void revocarSesion(String sessionId) {
        AuthSession session = authSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> ApiException.unauthorized(
                        "AUTH_SESSION_NOT_FOUND",
                        "La sesión no existe"
                ));

        if (session.getRevokedAt() == null) {
            session.setRevokedAt(Instant.now());
        }
    }

    @Transactional
    public void revocarSesionesActivas(UserAccount user) {
        Instant now = Instant.now();
        authSessionRepository.findByUserAccountAndRevokedAtIsNullAndExpiresAtAfter(user, now)
                .forEach(session -> session.setRevokedAt(now));
    }

    @Transactional(readOnly = true)
    public AuthSessionValidationResult validarSesionJwt(String sessionId, Long userId) {
        if (sessionId == null || sessionId.isBlank()) {
            return AuthSessionValidationResult.invalid("AUTH_SESSION_MISSING", "El token no contiene sesión");
        }

        if (userId == null) {
            return AuthSessionValidationResult.invalid("AUTH_USER_MISSING", "El token no contiene usuario");
        }

        return authSessionRepository.findBySessionId(sessionId)
                .map(session -> validarSesionPersistida(session, userId))
                .orElseGet(() -> AuthSessionValidationResult.invalid(
                        "AUTH_SESSION_NOT_FOUND",
                        "La sesión no existe"
                ));
    }

    private AuthSessionValidationResult validarSesionPersistida(AuthSession session, Long userId) {
        if (session.getRevokedAt() != null) {
            return AuthSessionValidationResult.invalid("AUTH_SESSION_REVOKED", "La sesión está revocada");
        }

        if (!session.getExpiresAt().isAfter(Instant.now())) {
            return AuthSessionValidationResult.invalid("AUTH_SESSION_EXPIRED", "La sesión ha caducado");
        }

        UserAccount user = session.getUserAccount();
        if (!user.getId().equals(userId)) {
            return AuthSessionValidationResult.invalid("AUTH_SESSION_USER_MISMATCH", "La sesión no pertenece al usuario del token");
        }

        if (!user.isEnabled()) {
            return AuthSessionValidationResult.invalid("AUTH_USER_DISABLED", "El usuario está deshabilitado");
        }

        return AuthSessionValidationResult.ok();
    }
}
