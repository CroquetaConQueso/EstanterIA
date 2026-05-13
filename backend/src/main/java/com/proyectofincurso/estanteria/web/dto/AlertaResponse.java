package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;

import java.time.Instant;

public record AlertaResponse(
        Long id,
        TipoAlerta tipo,
        PrioridadAlerta prioridad,
        EstadoAlerta estado,
        String mensaje,
        Instant createdAt,
        Instant resueltaAt,
        SeccionResponse seccion,
        EstanteriaResumenResponse estanteria,
        AlertaSlotResponse slot,
        AlertaAsignacionResponse asignacion
) {
}
