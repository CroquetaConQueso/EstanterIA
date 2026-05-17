package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Informe de rotacion visual basado en vacios detectados por inspecciones; no representa ventas reales.")
public record InformeRotacionVisualResponse(
        @Schema(description = "Periodo analizado por el informe")
        InformeRotacionVisualPeriodoResponse periodo,
        @Schema(description = "Filtros aplicados para generar el informe")
        InformeRotacionVisualFiltrosResponse filtros,
        @Schema(description = "Totales agregados de inspecciones y resultados visuales")
        InformeRotacionVisualResumenResponse resumen,
        @Schema(description = "Ranking de productos con mas vacios visuales detectados")
        List<ProductoVaciadoResponse> productosMasVaciados,
        @Schema(description = "Ranking de slots con mas vacios visuales detectados")
        List<SlotVaciadoResponse> slotsMasVaciados,
        @Schema(description = "Productos esperados que no registraron vacios en el periodo")
        List<ProductoSinVaciosResponse> productosSinVacios,
        @Schema(description = "Vacios visuales agregados por dia de la semana")
        List<ResumenDiaSemanaResponse> resumenPorDiaSemana
) {
}
