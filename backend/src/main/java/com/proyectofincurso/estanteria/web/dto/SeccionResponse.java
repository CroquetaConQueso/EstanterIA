package com.proyectofincurso.estanteria.web.dto;

public record SeccionResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        Boolean activa
) {
}
