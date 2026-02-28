package com.proyectofincurso.estanteria.auth;

import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.proyectofincurso.estanteria.persistence.entity.UserRole;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserAccountRepository repo;
    private final PasswordEncoder encoder;

    public AuthService(UserAccountRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public AuthUser authenticate(String email, String rawPassword) {
        UserAccount user = repo.findByEmailIgnoreCase(email)
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

    public void verificar(String username, String email, String password){
        if(repo.existsByUsernameIgnoreCase(username)){    
            throw new UnauthorizedException("Ya existe un usuario con ese nombre");
        }else if(repo.existsByEmailIgnoreCase(email)){
            throw new UnauthorizedException("Ya existe un usuario con ese email");
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
