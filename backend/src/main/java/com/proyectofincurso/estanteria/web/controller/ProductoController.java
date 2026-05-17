package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.ActualizarProductoRequest;
import com.proyectofincurso.estanteria.web.dto.CrearProductoRequest;
import com.proyectofincurso.estanteria.web.dto.ProductoCreadoResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    @Operation(summary = "Listar productos", description = "Requiere autenticacion. Por defecto devuelve solo productos activos disponibles para slots.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Productos devueltos"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public List<ProductoResumenResponse> listarProductos(
            @Parameter(description = "Incluye productos inactivos para consultas historicas")
            @RequestParam(name = "incluirInactivos", defaultValue = "false") boolean incluirInactivos) {
        return modeloOperativoService.obtenerProductos(incluirInactivos);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear producto", description = "Requiere ADMIN/SUPERADMIN. Crea un producto basico y lo puede vincular a proveedor demo.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Producto creado"),
            @ApiResponse(responseCode = "400", description = "Datos de producto invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "409", description = "Codigo interno duplicado")
    })
    public ProductoCreadoResponse crearProducto(@Valid @RequestBody CrearProductoRequest request) {
        return modeloOperativoService.crearProducto(request);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Editar producto", description = "Requiere ADMIN/SUPERADMIN. Actualiza nombre, descripcion y stock booleano demo si existe.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos de producto invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Producto inexistente"),
            @ApiResponse(responseCode = "409", description = "Conflicto de stock o codigo duplicado")
    })
    public ProductoCreadoResponse actualizarProducto(
                                                     @Parameter(description = "Identificador del producto")
                                                     @PathVariable Long id,
                                                     @Valid @RequestBody ActualizarProductoRequest request) {
        return modeloOperativoService.actualizarProducto(id, request);
    }

    @PatchMapping(value = "/{id}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Desactivar producto", description = "Requiere ADMIN/SUPERADMIN. Desactiva el producto sin borrado fisico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto desactivado o ya inactivo"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Producto inexistente")
    })
    public ProductoCreadoResponse desactivarProducto(
            @Parameter(description = "Identificador del producto")
            @PathVariable Long id) {
        return modeloOperativoService.desactivarProducto(id);
    }

    @PatchMapping(value = "/{id}/reactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Reactivar producto", description = "Requiere ADMIN/SUPERADMIN. Vuelve a marcar el producto como activo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto reactivado o ya activo"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Producto inexistente")
    })
    public ProductoCreadoResponse reactivarProducto(
            @Parameter(description = "Identificador del producto")
            @PathVariable Long id) {
        return modeloOperativoService.reactivarProducto(id);
    }
}
