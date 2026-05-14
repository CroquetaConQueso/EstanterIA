package com.proyectofincurso.estanteria.auth;

public record AuthSessionValidationResult(boolean valid, String code, String message) {

    public static AuthSessionValidationResult ok() {
        return new AuthSessionValidationResult(true, "OK", "Sesión válida");
    }

    public static AuthSessionValidationResult invalid(String code, String message) {
        return new AuthSessionValidationResult(false, code, message);
    }
}
