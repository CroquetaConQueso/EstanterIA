package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.CrearProductoRequest;
import com.proyectofincurso.estanteria.web.dto.ProductoCreadoResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "Productos activos y creacion basica")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class ProductoController {

    private final ModeloOperativoService modeloOperativoService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar productos activos", description = "Requiere autenticacion. Devuelve productos activos disponibles para slots.")
    public List<ProductoResumenResponse> listarProductosActivos() {
        return modeloOperativoService.obtenerProductosActivos();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear producto", description = "Requiere ADMIN/SUPERADMIN. Crea un producto basico y lo puede vincular a proveedor demo.")
    public ProductoCreadoResponse crearProducto(@Valid @RequestBody CrearProductoRequest request) {
        return modeloOperativoService.crearProducto(request);
    }
}
