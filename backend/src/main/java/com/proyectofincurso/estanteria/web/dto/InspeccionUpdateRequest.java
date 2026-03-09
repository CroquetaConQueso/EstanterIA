package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import lombok.Data;

@Data
public class InspeccionUpdateRequest {
    private String notas;
    private EstanteriaEstado estado;
}