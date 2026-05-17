package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Resumen de vacios visuales agrupados por dia de la semana.")
public record ResumenDiaSemanaResponse(
        String diaSemana,
        Integer vaciosDetectados
) {
}
