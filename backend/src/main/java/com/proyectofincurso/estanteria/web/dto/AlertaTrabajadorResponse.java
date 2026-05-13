package com.proyectofincurso.estanteria.web.dto;

import java.time.Instant;

public record AlertaTrabajadorResponse(
        Long id,
        AlertaResponse alerta,
        Instant notificadaAt,
        Boolean leida,
        Instant leidaAt
) {
}
