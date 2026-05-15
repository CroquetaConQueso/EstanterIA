package com.proyectofincurso.estanteria.web.dto;

public record PlanoResumenResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        Double ancho,
        Double alto,
        Boolean activo
) {
}
