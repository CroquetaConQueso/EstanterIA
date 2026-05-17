package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "Asignacion activa o historica de producto/proveedor asociada a un slot operativo.")
public record AsignacionActivaSlotResponse(
        Long id,
        Long productoProveedorId,
        ProductoResumenResponse productoAsignado,
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
