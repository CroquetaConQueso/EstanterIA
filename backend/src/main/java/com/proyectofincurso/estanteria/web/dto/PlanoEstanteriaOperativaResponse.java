package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.OrientacionEstanteriaLayout;

import java.util.List;

public record PlanoEstanteriaOperativaResponse(
        Long layoutId,
        Long zonaId,
        Double x,
        Double y,
        Double width,
        Double height,
        OrientacionEstanteriaLayout orientacion,
        EstanteriaResumenResponse estanteria,
        PlanoUltimaInspeccionResponse ultimaInspeccion,
        List<PlanoSlotOperativoResponse> slots,
        List<PlanoAlertaResumenResponse> alertasAbiertas,
        List<PlanoTareaResumenResponse> tareasActivas
) {
}
