package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;

public record PlanoAlertaResumenResponse(
        Long id,
        TipoAlerta tipo,
        PrioridadAlerta prioridad,
        String mensaje,
        String slotId
) {
}
