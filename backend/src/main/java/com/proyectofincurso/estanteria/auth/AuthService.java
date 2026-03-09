package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.entity.UserRole;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository repo;
    private final PasswordEncoder encoder;
    private final PasswordResetService passwordResetService;

    public AuthUser authenticate(String email, String rawPassword) {
        String normalizedEmail = normalizeEmail(email);

        UserAccount user = repo.findByEmailIgnoreCase(normalizedEmail)
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

    @Transactional
    public void verificar(String username, String email, String password, String role) {
        String normalizedUsername = normalizeUsername(username);
        String normalizedEmail = normalizeEmail(email);

        if (repo.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw ApiException.conflict(
                    "USERNAME_ALREADY_EXISTS",
                    "Ya existe un usuario con ese nombre"
            );
        }

        if (repo.existsByEmailIgnoreCase(normalizedEmail)) {
            throw ApiException.conflict(
                    "EMAIL_ALREADY_EXISTS",
                    "Ya existe un usuario con ese email"
            );
        }

        UserAccount user = new UserAccount();
        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(encoder.encode(password));
        user.setRole(parseRoleOrDefault(role));
        user.setEnabled(true);

        try {
            repo.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            throw ApiException.conflict(
                    "USER_ALREADY_EXISTS",
                    "Ya existe una cuenta con esos datos"
            );
        }
    }

    public void requestPasswordRecovery(String email) {
        passwordResetService.requestPasswordRecovery(email);
    }

    private String normalizeUsername(String username) {
        return username == null ? "" : username.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
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