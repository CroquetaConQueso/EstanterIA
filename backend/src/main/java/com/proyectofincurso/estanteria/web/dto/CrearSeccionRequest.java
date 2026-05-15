package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrearSeccionRequest(
        @NotBlank(message = "El codigo de empresa es obligatorio")
        @Size(max = 50, message = "El codigo de empresa no puede superar 50 caracteres")
        String empresaCodigo,

        @NotBlank(message = "El codigo de seccion es obligatorio")
        @Size(max = 50, message = "El codigo de seccion no puede superar 50 caracteres")
        String codigo,

        @NotBlank(message = "El nombre de seccion es obligatorio")
        @Size(max = 150, message = "El nombre de seccion no puede superar 150 caracteres")
        String nombre,

        String descripcion
) {
}
