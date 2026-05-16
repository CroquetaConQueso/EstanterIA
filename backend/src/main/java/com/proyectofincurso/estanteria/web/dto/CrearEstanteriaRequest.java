package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(description = "Payload para crear una estanteria con slots configurados")
public record CrearEstanteriaRequest(
        @NotNull(message = "La seccion es obligatoria")
        @Positive(message = "La seccion debe ser valida")
        Long seccionId,

        @NotBlank(message = "El codigo de estanteria es obligatorio")
        @Size(max = 50, message = "El codigo de estanteria no puede superar 50 caracteres")
        String codigo,

        @NotBlank(message = "El nombre de estanteria es obligatorio")
        @Size(max = 150, message = "El nombre de estanteria no puede superar 150 caracteres")
        String nombre,

        String descripcion,

        @NotEmpty(message = "La estanteria debe tener al menos un slot configurado")
        List<@Valid CrearEstanteriaSlotRequest> slots
) {
}
