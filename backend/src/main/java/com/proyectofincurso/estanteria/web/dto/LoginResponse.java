package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "Respuesta de autenticacion con token JWT Bearer")
public class LoginResponse {
    private String message;
    private String userName;
    private String role;
    @Schema(description = "Token JWT que debe usarse como Bearer token en endpoints privados")
    private String token;
}
