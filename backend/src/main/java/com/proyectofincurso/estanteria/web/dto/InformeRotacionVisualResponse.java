package com.proyectofincurso.estanteria.web.dto;

import java.util.List;

public record InformeRotacionVisualResponse(
        InformeRotacionVisualPeriodoResponse periodo,
        InformeRotacionVisualFiltrosResponse filtros,
        InformeRotacionVisualResumenResponse resumen,
        List<ProductoVaciadoResponse> productosMasVaciados,
        List<SlotVaciadoResponse> slotsMasVaciados,
        List<ProductoSinVaciosResponse> productosSinVacios,
        List<ResumenDiaSemanaResponse> resumenPorDiaSemana
) {
}
