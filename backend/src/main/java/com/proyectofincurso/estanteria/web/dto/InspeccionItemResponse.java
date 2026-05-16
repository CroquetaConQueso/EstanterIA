package com.proyectofincurso.estanteria.web.dto;

import java.time.Instant;

import com.proyectofincurso.estanteria.persistence.entity.EstadoGeneralVisual;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InspeccionItemResponse {
    private Long id;
    private String estanteriaCodigo;
    private String notas;
    private String imagenPath;
    private EstanteriaEstado estado;
    private Instant createdAt;
    private EstadoGeneralVisual estadoGeneralVisual;
    private Integer ocupados;
    private Integer vacios;
    private Integer anomalias;
    private String modeloVersion;
    private Instant capturadaEn;
    private Boolean eliminable;
    private String motivoNoEliminable;
}
