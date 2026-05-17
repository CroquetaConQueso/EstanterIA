package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.auth.AuthSessionService;
import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.dto.ActualizarPerfilRequest;
import com.proyectofincurso.estanteria.web.dto.PerfilEmpresaResponse;
import com.proyectofincurso.estanteria.web.dto.PerfilResponse;
import com.proyectofincurso.estanteria.web.dto.PerfilTrabajadorResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private static final String MENSAJE_RELOGIN = "Debe iniciar sesion de nuevo para refrescar la sesion.";
    private static final String MENSAJE_ACTUALIZADO = "Perfil actualizado.";

    private final UserAccountRepository userAccountRepository;
    private final AuthSessionService authSessionService;

    @Transactional(readOnly = true)
    public PerfilResponse obtenerPerfilActual(Long userId) {
        UserAccount user = obtenerUsuarioHabilitado(userId);
        return toResponse(user, false, null);
    }

    @Transactional
    public PerfilResponse actualizarPerfilActual(Long userId, ActualizarPerfilRequest request) {
        UserAccount user = obtenerUsuarioHabilitado(userId);
        String username = request.username().trim();
        String email = request.email().trim();
        boolean requiereNuevoLogin = !user.getUsername().equals(username) || !user.getEmail().equals(email);

        userAccountRepository.findByUsernameIgnoreCase(username)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw ApiException.conflict(
                            "USERNAME_ALREADY_EXISTS",
                            "Ya existe un usuario con ese nombre"
                    );
                });

        userAccountRepository.findByEmailIgnoreCase(email)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw ApiException.conflict(
                            "EMAIL_ALREADY_EXISTS",
                            "Ya existe un usuario con ese email"
                    );
                });

        user.setUsername(username);
        user.setEmail(email);
        UserAccount actualizado = userAccountRepository.save(user);
        if (requiereNuevoLogin) {
            authSessionService.revocarSesionesActivas(actualizado);
        }

        return toResponse(actualizado, requiereNuevoLogin, requiereNuevoLogin ? MENSAJE_RELOGIN : MENSAJE_ACTUALIZADO);
    }

    private UserAccount obtenerUsuarioHabilitado(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized(
                        "AUTH_USER_NOT_FOUND",
                        "No se encontro el usuario autenticado"
                ));

        if (!user.isEnabled()) {
            throw ApiException.forbidden(
                    "USER_DISABLED",
                    "Usuario deshabilitado"
            );
        }

        return user;
    }

    private PerfilResponse toResponse(UserAccount user, Boolean requiereNuevoLogin, String mensaje) {
        return new PerfilResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                toEmpresaResponse(user.getEmpresa()),
                toTrabajadorResponse(user.getTrabajador()),
                requiereNuevoLogin,
                mensaje
        );
    }

    private PerfilEmpresaResponse toEmpresaResponse(Empresa empresa) {
        if (empresa == null) {
            return null;
        }

        return new PerfilEmpresaResponse(
                empresa.getId(),
                empresa.getCodigo(),
                empresa.getNombre()
        );
    }

    private PerfilTrabajadorResponse toTrabajadorResponse(Trabajador trabajador) {
        if (trabajador == null) {
            return null;
        }

        return new PerfilTrabajadorResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getEmailContacto(),
                trabajador.getTelefonoContacto(),
                trabajador.getTipoTrabajador(),
                trabajador.getEstadoDisponibilidad(),
                trabajador.getActivo()
        );
    }
}
