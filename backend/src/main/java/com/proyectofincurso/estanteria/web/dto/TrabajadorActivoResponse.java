package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;

public record TrabajadorActivoResponse(
        Long id,
        String nombre,
        String apellidos,
        TipoTrabajador tipoTrabajador,
        Boolean activo
) {
}
