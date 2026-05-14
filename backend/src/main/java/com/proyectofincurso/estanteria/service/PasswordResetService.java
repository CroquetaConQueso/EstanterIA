package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.auth.AuthSessionService;
import com.proyectofincurso.estanteria.persistence.entity.PasswordResetToken;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.PasswordResetTokenRepository;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    public static final String RESPUESTA_NEUTRA = "Si el correo existe, recibirás un enlace para restablecer tu contraseña.";

    private static final Duration EXPIRACION_TOKEN = Duration.ofMinutes(30);

    private final UserAccountRepository userAccountRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordRecoveryMailService passwordRecoveryMailService;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionService authSessionService;

    @Transactional
    public String solicitarRecuperacion(String email) {
        String emailNormalizado = normalizarEmail(email);

        userAccountRepository.findByEmailIgnoreCase(emailNormalizado).ifPresent(user -> {
            Instant now = Instant.now();
            invalidarTokensActivos(user, now);

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(UUID.randomUUID().toString());
            resetToken.setCreatedAt(now);
            resetToken.setExpiresAt(now.plus(EXPIRACION_TOKEN));
            passwordResetTokenRepository.save(resetToken);

            try {
                passwordRecoveryMailService.enviarEnlaceRecuperacion(user, resetToken.getToken());
            } catch (RuntimeException ex) {
                log.warn("No se pudo enviar el correo de recuperación a {}", emailNormalizado, ex);
            }
        });

        return RESPUESTA_NEUTRA;
    }

    @Transactional(readOnly = true)
    public boolean tokenValido(String token) {
        return passwordResetTokenRepository.findByToken(token)
                .filter(this::esTokenValido)
                .isPresent();
    }

    @Transactional
    public void restablecerPassword(String token, String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw ApiException.badRequest("PASSWORD_CONFIRMATION_MISMATCH", "Las contraseñas no coinciden");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> ApiException.badRequest("RESET_TOKEN_INVALID", "El enlace de recuperación no es válido"));

        if (resetToken.getUsedAt() != null) {
            throw ApiException.badRequest("RESET_TOKEN_USED", "El enlace de recuperación ya fue utilizado");
        }

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("RESET_TOKEN_EXPIRED", "El enlace de recuperación ha caducado");
        }

        Instant now = Instant.now();
        UserAccount user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(password));
        resetToken.setUsedAt(now);

        invalidarOtrosTokensActivos(user, resetToken, now);
        authSessionService.revocarSesionesActivas(user);
        userAccountRepository.save(user);
    }

    private boolean esTokenValido(PasswordResetToken token) {
        return token.getUsedAt() == null && token.getExpiresAt().isAfter(Instant.now());
    }

    private void invalidarTokensActivos(UserAccount user, Instant now) {
        passwordResetTokenRepository.findByUserAndUsedAtIsNull(user)
                .forEach(token -> token.setUsedAt(now));
    }

    private void invalidarOtrosTokensActivos(UserAccount user, PasswordResetToken tokenActual, Instant now) {
        passwordResetTokenRepository.findByUserAndUsedAtIsNull(user).stream()
                .filter(token -> !token.getId().equals(tokenActual.getId()))
                .forEach(token -> token.setUsedAt(now));
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
