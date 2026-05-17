package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.ActualizarEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.CrearEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.EstanteriaConfiguracionResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorAsignadoEstanteriaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estanterias")
@RequiredArgsConstructor
@Tag(name = "Estanterias", description = "Estanterias y configuracion de slots")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class EstanteriaController {

    private final ModeloOperativoService modeloOperativoService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear estanteria", description = "Requiere ADMIN/SUPERADMIN. Crea una estanteria con su configuracion de slots.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Estanteria creada"),
            @ApiResponse(responseCode = "400", description = "Datos o slots invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Seccion o producto inexistente"),
            @ApiResponse(responseCode = "409", description = "Codigo duplicado")
    })
    public EstanteriaConfiguracionResponse crearEstanteria(@Valid @RequestBody CrearEstanteriaRequest request) {
        return modeloOperativoService.crearEstanteria(request);
    }

    @PatchMapping(value = "/{codigo}", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Actualizar estanteria", description = "Requiere ADMIN/SUPERADMIN. Actualiza datos y slots configurados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estanteria actualizada"),
            @ApiResponse(responseCode = "400", description = "Datos o slots invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Estanteria, seccion o producto inexistente")
    })
    public EstanteriaConfiguracionResponse actualizarEstanteria(
                                                                @Parameter(description = "Codigo de estanteria")
                                                                @PathVariable String codigo,
                                                                @Valid @RequestBody ActualizarEstanteriaRequest request) {
        return modeloOperativoService.actualizarEstanteria(codigo, request);
    }

    @PatchMapping(value = "/{codigo}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Desactivar estanteria", description = "Requiere ADMIN/SUPERADMIN. Desactiva la estanteria sin borrar historico operativo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estanteria desactivada o ya inactiva"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Estanteria inexistente")
    })
    public EstanteriaConfiguracionResponse desactivarEstanteria(
            @Parameter(description = "Codigo de estanteria")
            @PathVariable String codigo) {
        return modeloOperativoService.desactivarEstanteria(codigo);
    }

    @PatchMapping(value = "/{codigo}/reactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Reactivar estanteria", description = "Requiere ADMIN/SUPERADMIN. Vuelve a marcar la estanteria como activa.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estanteria reactivada o ya activa"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Estanteria inexistente")
    })
    public EstanteriaConfiguracionResponse reactivarEstanteria(
            @Parameter(description = "Codigo de estanteria")
            @PathVariable String codigo) {
        return modeloOperativoService.reactivarEstanteria(codigo);
    }

    @GetMapping(value = "/{codigo}/configuracion", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener configuracion de estanteria", description = "Requiere autenticacion. Devuelve datos, seccion y slots de una estanteria.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Configuracion de estanteria devuelta"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Estanteria inexistente")
    })
    public EstanteriaConfiguracionResponse obtenerConfiguracion(
            @Parameter(description = "Codigo de estanteria")
            @PathVariable String codigo) {
        return modeloOperativoService.obtenerConfiguracionDeEstanteria(codigo);
    }

    @GetMapping(value = "/{codigo}/trabajadores", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar trabajadores de estanteria", description = "Requiere autenticacion. Devuelve trabajadores asignados activos a una estanteria.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajadores asignados devueltos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Estanteria inexistente")
    })
    public List<TrabajadorAsignadoEstanteriaResponse> obtenerTrabajadoresAsignados(
            @Parameter(description = "Codigo de estanteria")
            @PathVariable String codigo) {
        return modeloOperativoService.obtenerTrabajadoresAsignadosEstanteria(codigo);
    }

    @PostMapping(value = "/{codigo}/trabajadores/{trabajadorId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Asignar trabajador a estanteria", description = "Requiere ADMIN/SUPERADMIN. Asigna un trabajador disponible a una estanteria activa.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajador asignado"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Estanteria o trabajador inexistente"),
            @ApiResponse(responseCode = "409", description = "Trabajador o estanteria no disponibles para asignacion")
    })
    public TrabajadorAsignadoEstanteriaResponse asignarTrabajador(
                                                                  @Parameter(description = "Codigo de estanteria")
                                                                  @PathVariable String codigo,
                                                                  @Parameter(description = "Identificador del trabajador")
                                                                  @PathVariable Long trabajadorId) {
        return modeloOperativoService.asignarTrabajadorEstanteria(codigo, trabajadorId);
    }

    @PatchMapping(value = "/{codigo}/trabajadores/{trabajadorId}/desasignar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Desasignar trabajador de estanteria", description = "Requiere ADMIN/SUPERADMIN. Marca la asignacion como inactiva sin borrar historico.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Asignacion desactivada sin borrar historico"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Asignacion, estanteria o trabajador inexistente")
    })
    public TrabajadorAsignadoEstanteriaResponse desasignarTrabajador(
                                                                     @Parameter(description = "Codigo de estanteria")
                                                                     @PathVariable String codigo,
                                                                     @Parameter(description = "Identificador del trabajador")
                                                                     @PathVariable Long trabajadorId) {
        return modeloOperativoService.desasignarTrabajadorEstanteria(codigo, trabajadorId);
    }
}
