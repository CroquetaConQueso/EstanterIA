package com.proyectofincurso.estanteria.web.dto;

public record InformeRotacionVisualResumenResponse(
        Integer totalInspecciones,
        Integer totalResultadosSlot,
        Integer totalVaciosDetectados,
        Integer totalOcupadosDetectados,
        Integer totalAnomaliasDetectadas
) {
}
