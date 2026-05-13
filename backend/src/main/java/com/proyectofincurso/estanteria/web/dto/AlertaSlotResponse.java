package com.proyectofincurso.estanteria.web.dto;

public record AlertaSlotResponse(
        Long id,
        String slotId,
        Integer orden,
        ProductoResumenResponse productoEsperado
) {
}
