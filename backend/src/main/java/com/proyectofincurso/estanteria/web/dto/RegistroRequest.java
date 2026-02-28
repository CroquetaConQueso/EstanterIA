package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegistroRequest {
    @NotBlank(message = "El usuario es obligatorio")
    private String username;

    @NotBlank(message = "El email es obligatorio ")
    @Email(message= "El email no tiene un formato valido")
    private String email;

    private String role;

    @NotBlank(message = "La tienda es obligatoria")
    private String tienda;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

}
