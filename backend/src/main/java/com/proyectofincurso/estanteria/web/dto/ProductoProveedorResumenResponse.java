package com.proyectofincurso.estanteria.web.dto;

public record ProductoProveedorResumenResponse(
        Long id,
        ProductoResumenResponse producto,
        ProveedorResumenResponse proveedor,
        String claveProductoProveedor,
        Boolean stockDisponible,
        String stockMensaje
) {
}
