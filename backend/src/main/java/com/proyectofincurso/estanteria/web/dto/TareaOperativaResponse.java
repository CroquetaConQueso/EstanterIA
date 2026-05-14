package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;

import java.time.Instant;

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
