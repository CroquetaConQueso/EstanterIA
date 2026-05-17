package com.proyectofincurso.estanteria.web.dto;

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
