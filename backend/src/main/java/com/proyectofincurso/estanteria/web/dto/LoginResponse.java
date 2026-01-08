package com.proyectofincurso.estanteria.web.dto;

import  lombok.AllArgsConstructor;
import  lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String message;
    private String userName;
    private String userPassword;
}
