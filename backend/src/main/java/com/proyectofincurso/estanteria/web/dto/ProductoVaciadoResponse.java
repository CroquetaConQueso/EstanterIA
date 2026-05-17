package com.proyectofincurso.estanteria.web.dto;

import java.time.Instant;

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
