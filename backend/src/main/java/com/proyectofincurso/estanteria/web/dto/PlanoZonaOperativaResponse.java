package com.proyectofincurso.estanteria.web.dto;

import java.util.List;

public record PlanoZonaOperativaResponse(
        Long id,
        SeccionResponse seccion,
        Double x,
        Double y,
        Double width,
        Double height,
        List<PlanoResponsableResponse> responsables
) {
}
