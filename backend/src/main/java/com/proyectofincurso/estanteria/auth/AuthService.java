package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserAccountRepository repo;
    private final PasswordEncoder encoder;

    public AuthService(UserAccountRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public AuthUser authenticate(String userName, String rawPassword) {
        UserAccount user = repo.findByUsernameIgnoreCase(userName)
                .orElseThrow(() -> new UnauthorizedException("Credenciales inválidas"));

        if (!user.isEnabled()) {
            throw new UnauthorizedException("Usuario deshabilitado");
        }

        boolean ok = encoder.matches(rawPassword, user.getPasswordHash());
        if (!ok) {
            throw new UnauthorizedException("Credenciales inválidas");
        }

        return new AuthUser(user.getUsername(), user.getRole().name());
    }
}
