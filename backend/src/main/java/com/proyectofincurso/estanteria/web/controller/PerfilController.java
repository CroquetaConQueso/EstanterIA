package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.PerfilService;
import com.proyectofincurso.estanteria.web.dto.PerfilResponse;
import com.proyectofincurso.estanteria.web.dto.PerfilUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PerfilController {

    private final PerfilService perfilService;

    public PerfilController(PerfilService perfilService) {
        this.perfilService = perfilService;
    }

    @GetMapping(value = "/api/perfil/me", produces = MediaType.APPLICATION_JSON_VALUE)
    public PerfilResponse obtenerPerfilActual(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false)
            String authorizationHeader
    ) {
        return perfilService.obtenerPerfilActual(authorizationHeader);
    }

    @PutMapping(
            value = "/api/perfil/me",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public PerfilResponse actualizarPerfilActual(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false)
            String authorizationHeader,
            @Valid @RequestBody PerfilUpdateRequest request
    ) {
        return perfilService.actualizarPerfilActual(authorizationHeader, request);
    }
}