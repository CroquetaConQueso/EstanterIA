package com.proyectofincurso.estanteria.web.dto;

import java.util.UUID;

public record ProductoResumenResponse(
        Long id,
        UUID productoUuid,
        String codigoInterno,
        String nombre,
        String descripcion,
        Boolean activo
) {
}
