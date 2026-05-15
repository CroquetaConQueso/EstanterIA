package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoGeneralVisual;

import java.time.Instant;

public record PlanoUltimaInspeccionResponse(
        Long id,
        Instant createdAt,
        Instant capturadaEn,
        EstadoGeneralVisual estadoGeneralVisual,
        Integer ocupados,
        Integer vacios,
        Integer anomalias
) {
}
