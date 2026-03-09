package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PerfilUpdateRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String userName;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene un formato válido")
    private String email;
}