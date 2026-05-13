package com.proyectofincurso.estanteria.web.dto;

public record ProveedorResumenResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion
) {
}
