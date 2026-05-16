package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Detalle de alerta operativa con contexto de slot, producto, proveedor y stock")
public record AlertaResponse(
        Long id,
        TipoAlerta tipo,
        PrioridadAlerta prioridad,
        EstadoAlerta estado,
        String mensaje,
        Instant createdAt,
        Instant resueltaAt,
        Long inspeccionId,
        String imagenPath,
        SeccionResponse seccion,
        EstanteriaResumenResponse estanteria,
        AlertaSlotResponse slot,
        AlertaAsignacionResponse asignacion,
        Long productoId,
        String productoCodigo,
        String productoNombre,
        Long proveedorId,
        String proveedorNombre,
        Boolean stockDisponible,
        String stockMensaje
) {
}
