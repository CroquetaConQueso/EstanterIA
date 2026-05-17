package com.proyectofincurso.estanteria.web.dto;

public record TrabajadorEstanteriaResumenResponse(
        Long id,
        String codigo,
        String nombre,
        Boolean activa,
        Long seccionId,
        String seccionCodigo,
        String seccionNombre
) {
}
