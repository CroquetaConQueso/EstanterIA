package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AuthSeed implements CommandLineRunner {

    private final UserAccountRepository repo;
    private final PasswordEncoder encoder;

    public AuthSeed(UserAccountRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        seedUserIfMissing("superadmin", "superadmin@example.com", "superadmin123", "SUPERADMIN");
        seedUserIfMissing("admin", "admin@example.com", "admin123", "ADMIN");
        seedUserIfMissing("worker", "worker@example.com", "worker123", "WORKER");
    }

    private void seedUserIfMissing(String username, String email, String rawPassword, String role) {
        boolean exists = repo.findByUsernameIgnoreCase(username).isPresent();
        if (!exists) {
            UserAccount user = new UserAccount();
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(encoder.encode(rawPassword));
            user.setRole(role);
            user.setEnabled(true);
            repo.save(user);
        }
    }
}
