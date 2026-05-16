package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Payload para crear un producto basico")
public record CrearProductoRequest(
        @NotBlank(message = "El codigo interno es obligatorio")
        @Size(max = 80, message = "El codigo interno no puede superar 80 caracteres")
        String codigoInterno,

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 160, message = "El nombre no puede superar 160 caracteres")
        String nombre,

        @Size(max = 2000, message = "La descripcion no puede superar 2000 caracteres")
        String descripcion,

        Boolean vincularProveedorDemo,
        Boolean stockDisponible
) {
}
