package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@Schema(description = "Slot configurado dentro de una estanteria")
public record CrearEstanteriaSlotRequest(
        @NotBlank(message = "El identificador de slot es obligatorio")
        @Size(max = 50, message = "El identificador de slot no puede superar 50 caracteres")
        String slotId,

        @NotNull(message = "El orden del slot es obligatorio")
        @Positive(message = "El orden del slot debe ser mayor que cero")
        Integer orden,

        @NotNull(message = "El producto esperado es obligatorio")
        @Positive(message = "El producto esperado debe ser valido")
        Long productoId,

        @NotNull(message = "La cantidad objetivo es obligatoria")
        @PositiveOrZero(message = "La cantidad objetivo no puede ser negativa")
        Integer cantidadObjetivo
) {
}
