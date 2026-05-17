package com.proyectofincurso.estanteria.web.dto;

public record InformeRotacionVisualFiltrosResponse(
        String planoCodigo,
        Long seccionId,
        String seccionNombre,
        String estanteriaCodigo
) {
}
