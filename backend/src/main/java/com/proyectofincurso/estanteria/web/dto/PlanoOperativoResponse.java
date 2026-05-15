package com.proyectofincurso.estanteria.web.dto;

import java.util.List;

public record PlanoOperativoResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        Double ancho,
        Double alto,
        EmpresaResponse empresa,
        List<PlanoZonaOperativaResponse> zonas,
        List<PlanoEstanteriaOperativaResponse> estanterias
) {
}
