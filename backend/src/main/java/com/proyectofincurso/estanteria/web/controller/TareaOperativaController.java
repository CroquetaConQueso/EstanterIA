package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.TareaOperativaService;
import com.proyectofincurso.estanteria.web.dto.ActualizarTareaOperativaRequest;
import com.proyectofincurso.estanteria.web.dto.CrearTareaManualRequest;
import com.proyectofincurso.estanteria.web.dto.TareaAsignarRequest;
import com.proyectofincurso.estanteria.web.dto.TareaEstadoRequest;
import com.proyectofincurso.estanteria.web.dto.TareaOperativaResponse;
import io.swagger.v3.oas.annotations.Operation;
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
    public List<TareaOperativaResponse> obtenerTareas() {
        return tareaOperativaService.obtenerTareas();
    }

    @GetMapping(value = "/pendientes", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar tareas pendientes", description = "Requiere autenticacion. Devuelve tareas no finalizadas.")
    public List<TareaOperativaResponse> obtenerTareasPendientes() {
        return tareaOperativaService.obtenerTareasPendientes();
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener tarea", description = "Requiere autenticacion. Devuelve el detalle de una tarea operativa.")
    public TareaOperativaResponse obtenerDetalle(@PathVariable Long id) {
        return tareaOperativaService.obtenerDetalle(id);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear tarea manual", description = "Requiere ADMIN/SUPERADMIN. Crea una tarea operativa manual sin cerrar alertas.")
    public TareaOperativaResponse crearTareaManual(@Valid @RequestBody CrearTareaManualRequest request) {
        return tareaOperativaService.crearTareaManual(request);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Editar tarea", description = "Requiere ADMIN/SUPERADMIN. Actualiza campos operativos de una tarea no finalizada.")
    public TareaOperativaResponse actualizarTarea(@PathVariable Long id,
                                                  @Valid @RequestBody ActualizarTareaOperativaRequest request) {
        return tareaOperativaService.actualizarTarea(id, request);
    }

    @PatchMapping(value = "/{id}/asignar", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Asignar trabajador", description = "Requiere autenticacion. Asigna trabajador a una tarea segun el flujo operativo existente.")
    public TareaOperativaResponse asignarTrabajador(@PathVariable Long id,
                                                    @Valid @RequestBody TareaAsignarRequest request) {
        return tareaOperativaService.asignarTrabajador(id, request.trabajadorId());
    }

    @PatchMapping(value = "/{id}/estado", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Cambiar estado de tarea", description = "Requiere autenticacion. Cambia el estado de una tarea. Resolver tarea no cierra alertas.")
    public TareaOperativaResponse cambiarEstado(@PathVariable Long id,
                                                @Valid @RequestBody TareaEstadoRequest request) {
        return tareaOperativaService.cambiarEstado(id, request.estado());
    }
}
