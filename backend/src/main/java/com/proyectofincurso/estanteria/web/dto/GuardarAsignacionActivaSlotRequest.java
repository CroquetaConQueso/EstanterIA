package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Schema(description = "Solicitud para crear o actualizar la asignacion activa de producto/proveedor en un slot.")
public record GuardarAsignacionActivaSlotRequest(
        @Schema(description = "Identificador de la relacion producto-proveedor activa")
        @NotNull(message = "El producto/proveedor es obligatorio")
        Long productoProveedorId,
        @Schema(description = "Fecha en la que el producto se coloco en el slot")
        LocalDate fechaColocacion,
        @Schema(description = "Fecha de caducidad del producto colocado")
        LocalDate fechaCaducidad,
        @Schema(description = "Fecha planificada para retirar el producto antes de caducar")
        LocalDate fechaRetiradaProgramada
) {
}
