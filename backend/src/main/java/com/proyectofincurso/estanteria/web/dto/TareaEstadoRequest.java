package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import jakarta.validation.constraints.NotNull;

public record TareaEstadoRequest(
        @NotNull EstadoTareaOperativa estado
) {
}
