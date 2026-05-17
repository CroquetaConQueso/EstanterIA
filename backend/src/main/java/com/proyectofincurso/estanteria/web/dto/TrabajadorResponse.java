package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;

import java.util.List;

public record TrabajadorResponse(
        Long id,
        String nombre,
        String apellidos,
        String emailContacto,
        String telefonoContacto,
        TipoTrabajador tipoTrabajador,
        EstadoDisponibilidadTrabajador estadoDisponibilidad,
        Boolean activo,
        String empresaCodigo,
        String empresaNombre,
        List<TrabajadorEstanteriaResumenResponse> estanteriasAsignadas,
        long tareasPendientes,
        long tareasEnProgreso,
        List<TrabajadorTareaResumenResponse> tareasAsignadas
) {
}
