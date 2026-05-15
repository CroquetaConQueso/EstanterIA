package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ActualizarEstanteriaRequest(
        @NotBlank(message = "El nombre de estanteria es obligatorio")
        @Size(max = 150, message = "El nombre de estanteria no puede superar 150 caracteres")
        String nombre,

        String descripcion,

        @NotEmpty(message = "La estanteria debe tener al menos un slot configurado")
        List<@Valid ActualizarEstanteriaSlotRequest> slots
) {
}
