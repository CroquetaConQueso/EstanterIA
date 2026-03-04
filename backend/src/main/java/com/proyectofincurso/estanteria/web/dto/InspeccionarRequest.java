package com.proyectofincurso.estanteria.persistence.entity;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;
public class InspeccionarRequest {
    
    @NotBlank
    private Instant createdAt;

    private String notas;

    private String imagenPath;

    @NotBlank
    private EstanteriaEstado estado;
}
