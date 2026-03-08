package com.proyectofincurso.estanteria.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class MeResponse {
    private String userName;
    private String email;
    private String role;
    private Instant createdAt;
}