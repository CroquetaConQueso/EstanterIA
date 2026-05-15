package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record PlanoZonaRequest(
        @NotNull(message = "La seccion es obligatoria")
        Long seccionId,

        @NotNull(message = "La coordenada x es obligatoria")
        @PositiveOrZero(message = "La coordenada x no puede ser negativa")
        Double x,

        @NotNull(message = "La coordenada y es obligatoria")
        @PositiveOrZero(message = "La coordenada y no puede ser negativa")
        Double y,

        @NotNull(message = "El ancho es obligatorio")
        @Positive(message = "El ancho debe ser mayor que cero")
        Double width,

        @NotNull(message = "El alto es obligatorio")
        @Positive(message = "El alto debe ser mayor que cero")
        Double height
) {
}
