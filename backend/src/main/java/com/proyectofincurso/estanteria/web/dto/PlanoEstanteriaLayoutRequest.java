package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.OrientacionEstanteriaLayout;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record PlanoEstanteriaLayoutRequest(
        @NotBlank(message = "El codigo de estanteria es obligatorio")
        @Size(max = 50, message = "El codigo de estanteria no puede superar 50 caracteres")
        String estanteriaCodigo,

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
        Double height,

        @NotNull(message = "La orientacion es obligatoria")
        OrientacionEstanteriaLayout orientacion
) {
}
