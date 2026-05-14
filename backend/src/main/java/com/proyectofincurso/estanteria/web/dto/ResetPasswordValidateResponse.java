package com.proyectofincurso.estanteria.web.dto;

public record ResetPasswordValidateResponse(
        boolean valid,
        String message
) {
}
