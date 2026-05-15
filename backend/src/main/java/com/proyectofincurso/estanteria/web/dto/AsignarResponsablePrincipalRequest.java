package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AsignarResponsablePrincipalRequest(
        @NotNull(message = "El trabajador es obligatorio")
        @Positive(message = "El trabajador debe ser valido")
        Long trabajadorId
) {
}
