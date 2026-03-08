package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.entity.UserRole;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository repo;
    private final PasswordEncoder encoder;
    private final PasswordRecoveryMailService passwordRecoveryMailService;

    public AuthUser authenticate(String email, String rawPassword) {
        UserAccount user = repo.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized(
                        "INVALID_CREDENTIALS",
                        "Credenciales inválidas"
                ));

        boolean ok = encoder.matches(rawPassword, user.getPasswordHash());
        if (!ok) {
            throw ApiException.unauthorized(
                    "INVALID_CREDENTIALS",
                    "Credenciales inválidas"
            );
        }

        if (!user.isEnabled()) {
            throw ApiException.forbidden(
                    "USER_DISABLED",
                    "Usuario deshabilitado"
            );
        }

        return new AuthUser(
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public void verificar(String username, String email, String password, String role) {
        if (repo.existsByUsernameIgnoreCase(username)) {
            throw ApiException.conflict(
                    "USERNAME_ALREADY_EXISTS",
                    "Ya existe un usuario con ese nombre"
            );
        }

        if (repo.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict(
                    "EMAIL_ALREADY_EXISTS",
                    "Ya existe un usuario con ese email"
            );
        }

        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(password));
        user.setRole(parseRoleOrDefault(role));
        user.setEnabled(true);

        repo.save(user);
    }

    public void requestPasswordRecovery(String email) {
        String normalizedEmail = email == null ? "" : email.trim();

        if (normalizedEmail.isEmpty()) {
            throw ApiException.badRequest(
                    "INVALID_EMAIL",
                    "El email es obligatorio"
            );
        }

        repo.findByEmailIgnoreCase(normalizedEmail)
                .ifPresent(user -> {
                    try {
                        passwordRecoveryMailService.sendRecoveryEmail(user);
                    } catch (MailException ex) {
                        throw ApiException.internalError(
                                "RECOVERY_MAIL_ERROR",
                                "No se pudo enviar el correo de recuperación"
                        );
                    }
                });
    }

    private UserRole parseRoleOrDefault(String role) {
        if (role == null || role.trim().isEmpty()) {
            return UserRole.WORKER;
        }

        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return UserRole.WORKER;
        }
    }
}