package com.proyectofincurso.estanteria.web.dto;

public record PlanoZonaOperativaResponse(
        Long id,
        SeccionResponse seccion,
        Double x,
        Double y,
        Double width,
        Double height
) {
}
