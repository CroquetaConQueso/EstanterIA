package com.proyectofincurso.estanteria.web.dto;

public record PlanoZonaResponse(
        Long id,
        SeccionResponse seccion,
        Double x,
        Double y,
        Double width,
        Double height
) {
}
