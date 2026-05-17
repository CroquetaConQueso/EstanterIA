package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resumen de la revision manual o programada de caducidades.")
public record RevisionCaducidadesResponse(
        @Schema(description = "Asignaciones activas evaluadas")
        Integer asignacionesRevisadas,
        @Schema(description = "Alertas nuevas creadas durante la revision")
        Integer alertasCreadas,
        @Schema(description = "Alertas abiertas equivalentes que ya existian")
        Integer alertasExistentes,
        @Schema(description = "Mensaje operativo para mostrar fuera del detalle de alerta")
        String mensaje
) {
}
