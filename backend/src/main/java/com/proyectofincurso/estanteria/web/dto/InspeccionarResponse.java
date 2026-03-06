package com.proyectofincurso.estanteria.web.dto;

import java.time.Instant;

import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InspeccionarResponse {
    private String message;
    private Long id;
    private String estanteriaCodigo;
    private String notas;
    private String imagenPath;
    private EstanteriaEstado estado;
    private Instant createdAt;
}
