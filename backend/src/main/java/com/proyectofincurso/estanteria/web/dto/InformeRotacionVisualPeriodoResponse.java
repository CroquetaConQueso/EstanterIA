package com.proyectofincurso.estanteria.web.dto;

import java.time.LocalDate;

public record InformeRotacionVisualPeriodoResponse(
        LocalDate fechaDesde,
        LocalDate fechaHasta
) {
}
