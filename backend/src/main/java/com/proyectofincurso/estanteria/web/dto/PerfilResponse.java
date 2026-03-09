package com.proyectofincurso.estanteria.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PerfilResponse {
    private String userName;
    private String email;
    private String role;
    private boolean enabled;
}
