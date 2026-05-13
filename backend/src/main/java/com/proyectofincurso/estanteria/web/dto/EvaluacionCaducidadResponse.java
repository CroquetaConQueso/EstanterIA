package com.proyectofincurso.estanteria.web.dto;

public record EvaluacionCaducidadResponse(
        Integer asignacionesEvaluadas,
        Integer alertasCreadas,
        Integer alertasExistentes,
        Integer notificacionesCreadas
) {
}
