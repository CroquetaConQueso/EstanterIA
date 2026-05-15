package com.proyectofincurso.estanteria.web.dto;

import java.util.List;

public record PlanoSlotOperativoResponse(
        String slotId,
        Integer orden,
        ProductoResumenResponse productoEsperado,
        String estadoVisual,
        Double confianza,
        Boolean tieneAlertaAbierta,
        List<String> tiposAlertas
) {
}
