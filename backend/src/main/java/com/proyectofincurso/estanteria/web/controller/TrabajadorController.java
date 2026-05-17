package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.service.TrabajadorService;
import com.proyectofincurso.estanteria.web.dto.ActualizarTrabajadorRequest;
import com.proyectofincurso.estanteria.web.dto.AlertaTrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.CrearTrabajadorRequest;
import com.proyectofincurso.estanteria.web.dto.TrabajadorActivoResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/trabajadores")
@RequiredArgsConstructor
@Tag(name = "Trabajadores", description = "Trabajadores activos y notificaciones operativas")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class TrabajadorController {

    private final AlertaOperativaService alertaOperativaService;
    private final TrabajadorRepository trabajadorRepository;
    private final TrabajadorService trabajadorService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar trabajadores", description = "Requiere autenticacion. Devuelve trabajadores operativos para gestion de equipo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajadores devueltos"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public List<TrabajadorResponse> listarTrabajadores(
            @Parameter(description = "Incluye trabajadores inactivos para consulta historica")
            @RequestParam(name = "incluirInactivos", defaultValue = "false") boolean incluirInactivos) {
        return trabajadorService.listarTrabajadores(incluirInactivos);
    }

    @GetMapping(value = "/activos", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar trabajadores activos", description = "Requiere autenticacion. Devuelve trabajadores activos para asignaciones y responsables.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajadores disponibles devueltos"),
            @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    public List<TrabajadorActivoResponse> listarTrabajadoresActivos() {
        return trabajadorRepository.findActivosDisponiblesOrderByApellidosAscNombreAsc(EstadoDisponibilidadTrabajador.DISPONIBLE)
                .stream()
                .map(this::toTrabajadorActivoResponse)
                .toList();
    }

    @GetMapping(value = "/{trabajadorId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Detalle de trabajador", description = "Requiere autenticacion. Devuelve datos de gestion, estanterias y tareas activas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalle de trabajador devuelto"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Trabajador inexistente")
    })
    public TrabajadorResponse obtenerTrabajador(
            @Parameter(description = "Identificador del trabajador")
            @PathVariable Long trabajadorId) {
        return trabajadorService.obtenerTrabajador(trabajadorId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Crear trabajador", description = "Requiere ADMIN/SUPERADMIN. Crea un trabajador operativo, no una cuenta de usuario.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Trabajador creado"),
            @ApiResponse(responseCode = "400", description = "Datos de trabajador invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "409", description = "Email o telefono duplicado")
    })
    public TrabajadorResponse crearTrabajador(@Valid @RequestBody CrearTrabajadorRequest request) {
        return trabajadorService.crearTrabajador(request);
    }

    @PatchMapping(value = "/{trabajadorId}", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Editar trabajador", description = "Requiere ADMIN/SUPERADMIN. Actualiza datos operativos y disponibilidad.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajador actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos de trabajador invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Trabajador inexistente"),
            @ApiResponse(responseCode = "409", description = "Email o telefono duplicado")
    })
    public TrabajadorResponse actualizarTrabajador(
                                                   @Parameter(description = "Identificador del trabajador")
                                                   @PathVariable Long trabajadorId,
                                                   @Valid @RequestBody ActualizarTrabajadorRequest request) {
        return trabajadorService.actualizarTrabajador(trabajadorId, request);
    }

    @PatchMapping(value = "/{trabajadorId}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Desactivar trabajador", description = "Requiere ADMIN/SUPERADMIN. Desactiva sin borrar historico operativo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajador desactivado o ya inactivo"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Trabajador inexistente")
    })
    public TrabajadorResponse desactivarTrabajador(
            @Parameter(description = "Identificador del trabajador")
            @PathVariable Long trabajadorId) {
        return trabajadorService.desactivarTrabajador(trabajadorId);
    }

    @PatchMapping(value = "/{trabajadorId}/reactivar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Reactivar trabajador", description = "Requiere ADMIN/SUPERADMIN. Vuelve a marcar el trabajador como activo.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trabajador reactivado o ya activo"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Trabajador inexistente")
    })
    public TrabajadorResponse reactivarTrabajador(
            @Parameter(description = "Identificador del trabajador")
            @PathVariable Long trabajadorId) {
        return trabajadorService.reactivarTrabajador(trabajadorId);
    }

    @GetMapping(value = "/{trabajadorId}/alertas", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar alertas de trabajador", description = "Requiere autenticacion. Devuelve notificaciones de alerta asociadas a un trabajador.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Alertas del trabajador devueltas"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "404", description = "Trabajador inexistente")
    })
    public List<AlertaTrabajadorResponse> obtenerAlertasDeTrabajador(
            @Parameter(description = "Identificador del trabajador")
            @PathVariable Long trabajadorId) {
        return alertaOperativaService.obtenerAlertasDeTrabajador(trabajadorId);
    }

    private TrabajadorActivoResponse toTrabajadorActivoResponse(Trabajador trabajador) {
        return new TrabajadorActivoResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getEmailContacto(),
                trabajador.getTipoTrabajador(),
                estadoDisponibilidad(trabajador),
                trabajador.getActivo()
        );
    }

    private EstadoDisponibilidadTrabajador estadoDisponibilidad(Trabajador trabajador) {
        return trabajador.getEstadoDisponibilidad() == null
                ? EstadoDisponibilidadTrabajador.DISPONIBLE
                : trabajador.getEstadoDisponibilidad();
    }
}
