package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;

public record PerfilTrabajadorResponse(
        Long id,
        String nombre,
        String apellidos,
        String emailContacto,
        String telefonoContacto,
        TipoTrabajador tipoTrabajador,
        Boolean activo
) {
}
