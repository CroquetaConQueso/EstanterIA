package com.proyectofincurso.estanteria.web.dto;

public record RevisionTrabajadoresNoDisponiblesResponse(
        Integer asignacionesRevisadas,
        Integer estanteriasAfectadas,
        Integer alertasCreadas,
        Integer alertasExistentes,
        String mensaje
) {
}
