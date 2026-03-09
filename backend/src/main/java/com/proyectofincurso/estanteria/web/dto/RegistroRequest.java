package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistroRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 80, message = "El nombre de usuario debe tener entre 3 y 80 caracteres")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene un formato válido")
    @Size(max = 160, message = "El email es demasiado largo")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 120, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;

    private String role;
}