package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record GuardarAsignacionActivaSlotRequest(
        @NotNull(message = "El producto/proveedor es obligatorio")
        Long productoProveedorId,
        LocalDate fechaColocacion,
        LocalDate fechaCaducidad,
        LocalDate fechaRetiradaProgramada
) {
}
