package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resumen de la revision de trabajadores ausentes, enfermos o inactivos asignados a trabajo operativo.")
public record RevisionTrabajadoresNoDisponiblesResponse(
        @Schema(description = "Asignaciones trabajador-estanteria revisadas")
        Integer asignacionesRevisadas,
        @Schema(description = "Estanterias con trabajadores o tareas afectadas")
        Integer estanteriasAfectadas,
        @Schema(description = "Alertas nuevas creadas durante la revision")
        Integer alertasCreadas,
        @Schema(description = "Alertas abiertas equivalentes que ya existian")
        Integer alertasExistentes,
        @Schema(description = "Mensaje operativo para mostrar fuera del detalle de alerta")
        String mensaje
) {
}
