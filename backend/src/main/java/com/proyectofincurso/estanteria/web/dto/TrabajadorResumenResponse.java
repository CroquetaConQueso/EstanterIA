package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;

public record TrabajadorResumenResponse(
        Long id,
        String nombre,
        String apellidos,
        String emailContacto,
        TipoTrabajador tipoTrabajador,
        Boolean responsablePrincipal
) {
}
