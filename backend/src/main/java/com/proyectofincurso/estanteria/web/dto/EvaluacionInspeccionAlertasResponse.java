package com.proyectofincurso.estanteria.web.dto;

public record EvaluacionInspeccionAlertasResponse(
        Long inspeccionId,
        Integer slotsEvaluados,
        Integer alertasCreadas,
        Integer alertasExistentes,
        Integer notificacionesCreadas
) {
}
