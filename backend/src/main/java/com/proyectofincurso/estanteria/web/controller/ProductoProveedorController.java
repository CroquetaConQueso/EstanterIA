package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.ProductoProveedorResumenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/productos-proveedor")
@RequiredArgsConstructor
@Tag(name = "Productos proveedor", description = "Opciones de producto/proveedor para inventario operativo")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class ProductoProveedorController {

    private final ModeloOperativoService modeloOperativoService;

    @GetMapping(value = "/activos", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar productos proveedor activos", description = "Requiere autenticacion. Devuelve opciones activas para asignaciones de slot.")
    public List<ProductoProveedorResumenResponse> listarActivos() {
        return modeloOperativoService.obtenerProductosProveedorActivos();
    }
}
