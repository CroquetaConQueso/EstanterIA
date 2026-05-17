package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.PerfilService;
import com.proyectofincurso.estanteria.web.dto.ActualizarPerfilRequest;
import com.proyectofincurso.estanteria.web.dto.PerfilResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Perfil", description = "Perfil del usuario autenticado")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class PerfilController {

    private final PerfilService perfilService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener perfil", description = "Requiere autenticacion. Devuelve cuenta, rol, empresa y trabajador vinculado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil del usuario devuelto"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public PerfilResponse obtenerPerfil(@AuthenticationPrincipal Jwt jwt) {
        return perfilService.obtenerPerfilActual(extraerUserId(jwt));
    }

    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Actualizar perfil", description = "Requiere autenticacion. Actualiza username/email del propio usuario y fuerza nuevo login.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos de perfil invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "409", description = "Username o email ya usados")
    })
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
