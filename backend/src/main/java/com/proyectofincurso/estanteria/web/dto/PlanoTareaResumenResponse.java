package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;

public record PlanoTareaResumenResponse(
        Long id,
        TipoTareaOperativa tipoTarea,
        EstadoTareaOperativa estadoTarea,
        PrioridadAlerta prioridad,
        String titulo,
        String slotId
) {
}
