package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.auth.SessionService;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.dto.PerfilResponse;
import com.proyectofincurso.estanteria.web.dto.PerfilUpdateRequest;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final UserAccountRepository userAccountRepository;
    private final SessionService sessionService;

    public PerfilResponse obtenerPerfilActual(String authorizationHeader) {
        UserAccount user = obtenerUsuarioActual(authorizationHeader);

        return new PerfilResponse(
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.isEnabled()
        );
    }

    public PerfilResponse actualizarPerfilActual(String authorizationHeader, PerfilUpdateRequest request) {
        UserAccount user = obtenerUsuarioActual(authorizationHeader);

        String nuevoUserName = request.getUserName().trim();
        String nuevoEmail = request.getEmail().trim();

        userAccountRepository.findByUsernameIgnoreCase(nuevoUserName)
                .filter(found -> !found.getId().equals(user.getId()))
                .ifPresent(found -> {
                    throw ApiException.conflict(
                            "USERNAME_ALREADY_EXISTS",
                            "Ya existe un usuario con ese nombre"
                    );
                });

        userAccountRepository.findByEmailIgnoreCase(nuevoEmail)
                .filter(found -> !found.getId().equals(user.getId()))
                .ifPresent(found -> {
                    throw ApiException.conflict(
                            "EMAIL_ALREADY_EXISTS",
                            "Ya existe un usuario con ese email"
                    );
                });

        user.setUsername(nuevoUserName);
        user.setEmail(nuevoEmail);

        userAccountRepository.save(user);

        sessionService.updateSessionUser(
                authorizationHeader,
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        );

        return new PerfilResponse(
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.isEnabled()
        );
    }

    private UserAccount obtenerUsuarioActual(String authorizationHeader) {
        SessionService.SessionUser session = sessionService.getRequiredSession(authorizationHeader);

        return userAccountRepository.findByUsernameIgnoreCase(session.userName())
                .orElseThrow(() -> ApiException.unauthorized(
                        "USER_NOT_FOUND",
                        "No se ha encontrado el usuario asociado a la sesión"
                ));
    }
}