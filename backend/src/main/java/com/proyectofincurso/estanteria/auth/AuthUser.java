package com.proyectofincurso.estanteria.auth;

public record AuthUser(Long userId, String userName, String email, String role) {
}
