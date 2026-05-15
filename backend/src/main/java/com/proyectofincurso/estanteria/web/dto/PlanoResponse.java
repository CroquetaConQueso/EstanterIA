package com.proyectofincurso.estanteria.web.dto;

import java.util.List;

public record PlanoResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        Double ancho,
        Double alto,
        Boolean activo,
        EmpresaResponse empresa,
        List<PlanoZonaResponse> zonas,
        List<PlanoEstanteriaLayoutResponse> estanterias
) {
}
