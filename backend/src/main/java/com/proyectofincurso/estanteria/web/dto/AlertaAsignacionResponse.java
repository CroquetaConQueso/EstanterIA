package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;

import java.time.LocalDate;

public record AlertaAsignacionResponse(
        Long id,
        ProductoResumenResponse producto,
        ProveedorResumenResponse proveedor,
        String claveProductoProveedor,
        LocalDate fechaCaducidad,
        LocalDate fechaRetiradaProgramada,
        EstadoAsignacionProductoSlot estadoAsignacion
) {
}
