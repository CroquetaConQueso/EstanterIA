package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Detalle de tarea operativa con contexto de asignacion, trabajador y stock")
public record TareaOperativaResponse(
        Long id,
        Long alertaId,
        TipoTareaOperativa tipoTarea,
        PrioridadAlerta prioridad,
        EstadoTareaOperativa estadoTarea,
        String titulo,
        String descripcion,
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
        String stockMensaje,
        TrabajadorResumenResponse trabajadorAsignado,
        Long asignadaPorUserAccountId,
        String asignadaPorUsername,
        Instant createdAt,
        Instant assignedAt,
        Instant fechaLimite,
        Instant resueltaAt,
        Instant updatedAt
) {
}
