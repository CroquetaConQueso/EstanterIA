package com.proyectofincurso.estanteria.web.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "El usuario es obligatorio")
    private String userName;

    @NotBlank(message = "La contraseña es obligatoria")
    private String userPassword;

    public LoginRequest(@JsonProperty("userName") String userName, @JsonProperty("userPassword") String userPassword) {
        this.userName = userName;
        this.userPassword = userPassword;
    }
}
