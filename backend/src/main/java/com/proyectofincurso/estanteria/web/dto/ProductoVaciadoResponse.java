package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Producto esperado con vacios visuales detectados durante el periodo del informe.")
public record ProductoVaciadoResponse(
        Long productoId,
        String productoCodigo,
        String productoNombre,
        String seccionNombre,
        String estanteriaCodigo,
        String slotId,
        Integer vaciosDetectados,
        Integer ocupadosDetectados,
        Integer anomaliasDetectadas,
        Integer totalInspecciones,
        Double porcentajeVacio,
        Instant ultimoVacioAt
) {
}
