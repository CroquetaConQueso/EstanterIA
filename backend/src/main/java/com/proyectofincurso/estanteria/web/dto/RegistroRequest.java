package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Datos de registro de usuario")
public class RegistroRequest {

    @NotBlank(message = "El usuario es obligatorio")
    @Size(min = 3, max = 80, message = "El usuario debe tener entre 3 y 80 caracteres")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene un formato válido")
    @Size(max = 120, message = "El email no puede superar 120 caracteres")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 120, message = "La contraseña debe tener entre 8 y 120 caracteres")
    private String password;
}
