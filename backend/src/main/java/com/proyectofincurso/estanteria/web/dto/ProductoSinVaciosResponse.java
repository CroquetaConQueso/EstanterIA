package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Producto esperado inspeccionado sin vacios visuales detectados en el periodo.")
public record ProductoSinVaciosResponse(
        Long productoId,
        String productoCodigo,
        String productoNombre,
        Integer totalInspecciones,
        Integer vaciosDetectados
) {
}
