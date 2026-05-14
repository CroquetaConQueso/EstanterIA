package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.NotNull;

public record TareaAsignarRequest(
        @NotNull Long trabajadorId
) {
}
