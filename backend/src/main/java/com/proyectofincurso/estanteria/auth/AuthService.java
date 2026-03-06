package com.proyectofincurso.estanteria.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.entity.UserRole;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository repo;
    private final PasswordEncoder encoder;

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

        return new AuthUser(user.getUsername(), user.getRole().name());
    }

    public void verificar(String username, String email, String password) {
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
        user.setRole(UserRole.WORKER);
        user.setEnabled(true);

        repo.save(user);
    }
}