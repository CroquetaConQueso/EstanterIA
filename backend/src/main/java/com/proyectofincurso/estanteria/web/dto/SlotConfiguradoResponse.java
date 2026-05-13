package com.proyectofincurso.estanteria.web.dto;

public record SlotConfiguradoResponse(
        Long id,
        String slotId,
        Integer orden,
        ProductoResumenResponse productoEsperado,
        Integer cantidadObjetivo,
        AsignacionActivaSlotResponse asignacionActiva
) {
}
