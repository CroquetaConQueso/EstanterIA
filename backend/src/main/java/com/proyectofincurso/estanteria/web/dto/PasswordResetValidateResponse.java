package com.proyectofincurso.estanteria.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class PasswordResetValidateResponse {
    private boolean valid;
    private String message;
    private Instant expiresAt;
}