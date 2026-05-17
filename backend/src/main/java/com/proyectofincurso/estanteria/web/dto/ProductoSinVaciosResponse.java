package com.proyectofincurso.estanteria.web.dto;

public record ProductoSinVaciosResponse(
        Long productoId,
        String productoCodigo,
        String productoNombre,
        Integer totalInspecciones,
        Integer vaciosDetectados
) {
}
