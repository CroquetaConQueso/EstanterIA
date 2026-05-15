package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;

import java.time.LocalDate;

public record AsignacionActivaSlotResponse(
        Long id,
        ProveedorResumenResponse proveedor,
        String claveProductoProveedor,
        Boolean stockDisponible,
        String stockMensaje,
        LocalDate fechaColocacion,
        LocalDate fechaCaducidad,
        LocalDate fechaRetiradaProgramada,
        LocalDate fechaRetiradaConfirmada,
        EstadoAsignacionProductoSlot estadoAsignacion,
        String observaciones
) {
}
