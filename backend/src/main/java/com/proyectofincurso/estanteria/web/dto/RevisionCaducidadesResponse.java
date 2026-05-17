package com.proyectofincurso.estanteria.web.dto;

public record RevisionCaducidadesResponse(
        Integer asignacionesRevisadas,
        Integer alertasCreadas,
        Integer alertasExistentes,
        String mensaje
) {
}
