package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;

public record PlanoResponsableResponse(
        Long trabajadorId,
        String nombre,
        String apellidos,
        TipoTrabajador tipoTrabajador,
        Boolean responsablePrincipal
) {
}
