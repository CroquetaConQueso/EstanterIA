package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;

public record TrabajadorAsignadoEstanteriaResponse(
        Long trabajadorId,
        String nombre,
        String apellidos,
        String emailContacto,
        TipoTrabajador tipoTrabajador,
        EstadoDisponibilidadTrabajador estadoDisponibilidad,
        Boolean activo
) {
}
