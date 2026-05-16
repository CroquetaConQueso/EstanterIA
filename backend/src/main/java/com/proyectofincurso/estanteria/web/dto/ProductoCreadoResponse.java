package com.proyectofincurso.estanteria.web.dto;

import java.util.UUID;

public record ProductoCreadoResponse(
        Long id,
        UUID productoUuid,
        String codigoInterno,
        String nombre,
        String descripcion,
        String imagenUrl,
        Boolean activo,
        ProveedorResumenResponse proveedor,
        Boolean stockDisponible,
        String stockMensaje
) {
}
