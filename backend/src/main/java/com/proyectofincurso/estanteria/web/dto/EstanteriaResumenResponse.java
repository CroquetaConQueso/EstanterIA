package com.proyectofincurso.estanteria.web.dto;

public record EstanteriaResumenResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        Boolean activa
) {
}
