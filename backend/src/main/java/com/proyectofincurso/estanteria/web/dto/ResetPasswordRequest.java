package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Cambio de password mediante token de recuperacion")
public record ResetPasswordRequest(
        @NotBlank(message = "El token es obligatorio")
        String token,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 120, message = "La contraseña debe tener entre 8 y 120 caracteres")
        String password,

        @NotBlank(message = "Debes repetir la contraseña")
        String confirmPassword
) {
}
