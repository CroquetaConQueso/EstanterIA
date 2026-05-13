package com.proyectofincurso.estanteria.web.dto;

public record EmpresaResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        Boolean activa
) {
}
