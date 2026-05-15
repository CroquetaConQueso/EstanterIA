package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.OrientacionEstanteriaLayout;

public record PlanoEstanteriaLayoutResponse(
        Long id,
        Long zonaId,
        EstanteriaResumenResponse estanteria,
        Double x,
        Double y,
        Double width,
        Double height,
        OrientacionEstanteriaLayout orientacion
) {
}
