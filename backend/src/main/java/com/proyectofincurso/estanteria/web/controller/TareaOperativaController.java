package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.TareaOperativaService;
import com.proyectofincurso.estanteria.web.dto.ActualizarTareaOperativaRequest;
import com.proyectofincurso.estanteria.web.dto.CrearTareaManualRequest;
import com.proyectofincurso.estanteria.web.dto.TareaAsignarRequest;
import com.proyectofincurso.estanteria.web.dto.TareaEstadoRequest;
import com.proyectofincurso.estanteria.web.dto.TareaOperativaResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tareas")
@RequiredArgsConstructor
@Tag(name = "Tareas", description = "Tareas operativas automaticas y manuales")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class TareaOperativaController {

    private final TareaOperativaService tareaOperativaService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar tareas", description = "Requiere autenticacion. Devuelve tareas operativas con contexto de producto y stock si aplica.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tareas devueltas"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public List<TareaOperativaResponse> obtenerTareas() {
        return tareaOperativaService.obtenerTareas();
    }

    @GetMapping(value = "/pendientes", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar tareas pendientes", description = "Requiere autenticacion. Devuelve tareas no finalizadas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tareas pendientes devueltas"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public List<TareaOperativaResponse> obtenerTareasPendientes() {
        return tareaOperativaService.obtenerTareasPendientes();
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener tarea", description = "Requiere autenticacion. Devuelve el detalle de una tarea operativa.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalle de tarea devuelto"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Tarea inexistente")
    })
    public TareaOperativaResponse obtenerDetalle(
            @Parameter(description = "Identificador de la tarea")
            @PathVariable Long id) {
        return tareaOperativaService.obtenerDetalle(id);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear tarea manual", description = "Requiere ADMIN/SUPERADMIN. Crea una tarea operativa manual sin cerrar alertas.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tarea manual creada"),
            @ApiResponse(responseCode = "400", description = "Datos o contexto de tarea invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Contexto operativo inexistente"),
            @ApiResponse(responseCode = "409", description = "Trabajador no disponible para asignacion")
    })
    public TareaOperativaResponse crearTareaManual(@Valid @RequestBody CrearTareaManualRequest request) {
        return tareaOperativaService.crearTareaManual(request);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Editar tarea", description = "Requiere ADMIN/SUPERADMIN. Actualiza campos operativos de una tarea no finalizada.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tarea actualizada"),
            @ApiResponse(responseCode = "400", description = "Datos o estado de tarea invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Tarea o contexto inexistente"),
            @ApiResponse(responseCode = "409", description = "Tarea finalizada o trabajador no disponible")
    })
    public TareaOperativaResponse actualizarTarea(
                                                  @Parameter(description = "Identificador de la tarea")
                                                  @PathVariable Long id,
                                                  @Valid @RequestBody ActualizarTareaOperativaRequest request) {
        return tareaOperativaService.actualizarTarea(id, request);
    }

    @PatchMapping(value = "/{id}/asignar", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Asignar trabajador", description = "Requiere autenticacion. Asigna trabajador a una tarea segun el flujo operativo existente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajador asignado a la tarea"),
            @ApiResponse(responseCode = "400", description = "Solicitud de asignacion invalida"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Tarea o trabajador inexistente"),
            @ApiResponse(responseCode = "409", description = "Trabajador no disponible o tarea no asignable")
    })
    public TareaOperativaResponse asignarTrabajador(
                                                    @Parameter(description = "Identificador de la tarea")
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody TareaAsignarRequest request) {
        return tareaOperativaService.asignarTrabajador(id, request.trabajadorId());
    }

    @PatchMapping(value = "/{id}/estado", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Cambiar estado de tarea", description = "Requiere autenticacion. Cambia el estado de una tarea. Resolver tarea no cierra alertas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de tarea actualizado"),
            @ApiResponse(responseCode = "400", description = "Estado o transicion invalida"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Tarea inexistente"),
            @ApiResponse(responseCode = "409", description = "Transicion no permitida")
    })
    public TareaOperativaResponse cambiarEstado(
                                                @Parameter(description = "Identificador de la tarea")
                                                @PathVariable Long id,
                                                @Valid @RequestBody TareaEstadoRequest request) {
        return tareaOperativaService.cambiarEstado(id, request.estado());
    }

    @PatchMapping(value = "/{id}/reabrir", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Reabrir tarea", description = "Requiere ADMIN/SUPERADMIN. Devuelve una tarea resuelta o cancelada a pendiente sin modificar alertas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tarea reabierta"),
            @ApiResponse(responseCode = "400", description = "La tarea no esta en estado reabrible"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Tarea inexistente")
    })
    public TareaOperativaResponse reabrirTarea(
            @Parameter(description = "Identificador de la tarea")
            @PathVariable Long id) {
        return tareaOperativaService.reabrirTarea(id);
    }
}
