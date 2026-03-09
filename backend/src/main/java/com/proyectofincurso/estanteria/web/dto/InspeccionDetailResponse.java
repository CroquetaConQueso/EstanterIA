package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class InspeccionDetailResponse {
    private Long id;
    private String estanteriaCodigo;
    private String notas;
    private String imagenPath;
    private String imageUrl;
    private EstanteriaEstado estado;
    private Instant createdAt;
    private Map<String, Integer> summary;
    private List<String> productosOk;
    private List<String> huecosDetectados;
}