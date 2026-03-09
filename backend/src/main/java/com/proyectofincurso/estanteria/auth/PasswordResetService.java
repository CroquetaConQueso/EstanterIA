package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.PasswordResetToken;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.PasswordResetTokenRepository;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.dto.PasswordResetValidateResponse;
import com.proyectofincurso.estanteria.web.dto.ResetPasswordRequest;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final Duration TOKEN_TTL = Duration.ofMinutes(30);

    private final UserAccountRepository userAccountRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordRecoveryMailService passwordRecoveryMailService;
    private final PasswordEncoder passwordEncoder;

    public void requestPasswordRecovery(String email) {
        String normalizedEmail = email == null ? "" : email.trim();

        if (normalizedEmail.isEmpty()) {
            throw ApiException.badRequest(
                    "INVALID_EMAIL",
                    "El email es obligatorio"
            );
        }

        userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .ifPresent(user -> {
                    invalidateActiveTokens(user);

                    PasswordResetToken resetToken = new PasswordResetToken();
                    resetToken.setToken(UUID.randomUUID().toString());
                    resetToken.setUser(user);
                    resetToken.setCreatedAt(Instant.now());
                    resetToken.setExpiresAt(Instant.now().plus(TOKEN_TTL));

                    passwordResetTokenRepository.save(resetToken);

                    try {
                        passwordRecoveryMailService.sendRecoveryEmail(user, resetToken.getToken());
                        log.info("Correo de recuperación enviado a {}", user.getEmail());
                    } catch (MailException ex) {
                        log.warn(
                                "No se pudo enviar el correo de recuperación a {}. Se mantiene respuesta académica OK.",
                                user.getEmail()
                        );
                        log.debug("Detalle técnico del fallo SMTP", ex);
                    }
                });
    }

    public PasswordResetValidateResponse validateResetToken(String token) {
        String normalizedToken = token == null ? "" : token.trim();

        if (normalizedToken.isEmpty()) {
            return new PasswordResetValidateResponse(false, "Token no válido.", null);
        }

        return passwordResetTokenRepository.findByToken(normalizedToken)
                .map(resetToken -> {
                    Instant now = Instant.now();

                    if (resetToken.getUsedAt() != null) {
                        return new PasswordResetValidateResponse(false, "Este enlace ya ha sido utilizado.", resetToken.getExpiresAt());
                    }

                    if (!resetToken.getExpiresAt().isAfter(now)) {
                        return new PasswordResetValidateResponse(false, "Este enlace ha caducado.", resetToken.getExpiresAt());
                    }

                    return new PasswordResetValidateResponse(true, "Token válido.", resetToken.getExpiresAt());
                })
                .orElseGet(() -> new PasswordResetValidateResponse(false, "Token no válido.", null));
    }

    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken().trim();
        String newPassword = request.getNewPassword().trim();
        String confirmPassword = request.getConfirmPassword().trim();

        if (!newPassword.equals(confirmPassword)) {
            throw ApiException.badRequest(
                    "PASSWORD_CONFIRMATION_MISMATCH",
                    "La confirmación de la contraseña no coincide"
            );
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> ApiException.badRequest(
                        "INVALID_RESET_TOKEN",
                        "El enlace de recuperación no es válido"
                ));

        Instant now = Instant.now();

        if (resetToken.getUsedAt() != null) {
            throw ApiException.badRequest(
                    "USED_RESET_TOKEN",
                    "Este enlace ya ha sido utilizado"
            );
        }

        if (!resetToken.getExpiresAt().isAfter(now)) {
            throw ApiException.badRequest(
                    "EXPIRED_RESET_TOKEN",
                    "El enlace de recuperación ha caducado"
            );
        }

        UserAccount user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userAccountRepository.save(user);

        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);

        invalidateActiveTokens(user);
    }

    private void invalidateActiveTokens(UserAccount user) {
        List<PasswordResetToken> activeTokens = passwordResetTokenRepository.findByUserAndUsedAtIsNull(user);
        Instant now = Instant.now();

        activeTokens.forEach(token -> token.setUsedAt(now));
        passwordResetTokenRepository.saveAll(activeTokens);
    }
}