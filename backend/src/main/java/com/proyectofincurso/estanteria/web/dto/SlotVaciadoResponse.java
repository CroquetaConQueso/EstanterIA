package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Slot fisico con mayor frecuencia de vacios visuales detectados.")
public record SlotVaciadoResponse(
        String seccionNombre,
        String estanteriaCodigo,
        String slotId,
        String productoEsperadoNombre,
        Integer vaciosDetectados,
        Integer totalInspecciones,
        Double porcentajeVacio
) {
}
