package com.proyectofincurso.estanteria.web.dto;

import java.util.List;

public record EstanteriaConfiguracionResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        Boolean activa,
        SeccionResponse seccion,
        List<TrabajadorResumenResponse> encargados,
        List<SlotConfiguradoResponse> slots
) {
}
