package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.PerfilService;
import com.proyectofincurso.estanteria.web.dto.ActualizarPerfilRequest;
import com.proyectofincurso.estanteria.web.dto.PerfilResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public PerfilResponse obtenerPerfil(@AuthenticationPrincipal Jwt jwt) {
        return perfilService.obtenerPerfilActual(extraerUserId(jwt));
    }

    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public PerfilResponse actualizarPerfil(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ActualizarPerfilRequest request
    ) {
        return perfilService.actualizarPerfilActual(extraerUserId(jwt), request);
    }

    private Long extraerUserId(Jwt jwt) {
        Number userId = jwt.getClaim("userId");
        if (userId == null) {
            throw ApiException.unauthorized(
                    "AUTH_USER_MISSING",
                    "El token no contiene usuario"
            );
        }

        return userId.longValue();
    }
}
