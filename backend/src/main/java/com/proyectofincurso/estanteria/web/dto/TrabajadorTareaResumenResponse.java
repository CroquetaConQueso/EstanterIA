package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;

import java.time.Instant;

public record TrabajadorTareaResumenResponse(
        Long id,
        String titulo,
        TipoTareaOperativa tipoTarea,
        PrioridadAlerta prioridad,
        EstadoTareaOperativa estadoTarea,
        Instant fechaLimite,
        String estanteriaCodigo,
        String estanteriaNombre
) {
}
