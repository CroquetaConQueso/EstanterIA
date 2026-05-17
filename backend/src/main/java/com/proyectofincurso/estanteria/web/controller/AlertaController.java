package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.AlertaResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaTrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.EvaluacionCaducidadResponse;
import com.proyectofincurso.estanteria.web.dto.RevisionCaducidadesResponse;
import com.proyectofincurso.estanteria.web.dto.RevisionTrabajadoresNoDisponiblesResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Alertas", description = "Alertas operativas y gestion administrativa")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class AlertaController {

    private final AlertaOperativaService alertaOperativaService;

    @GetMapping(value = "/alertas/abiertas", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar alertas abiertas", description = "Requiere autenticacion. Devuelve alertas abiertas con contexto operativo y stock si aplica.")
    public List<AlertaResponse> obtenerAlertasAbiertas() {
        return alertaOperativaService.obtenerAlertasAbiertas();
    }

    @PostMapping(value = "/alertas/evaluar-caducidad", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Evaluar caducidad", description = "Requiere ADMIN/SUPERADMIN. Evalua caducidades y genera alertas operativas.")
    public EvaluacionCaducidadResponse evaluarCaducidad() {
        return alertaOperativaService.evaluarCaducidad();
    }

    @PostMapping(value = "/alertas/revisar-caducidades", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Revisar caducidades", description = "Requiere ADMIN/SUPERADMIN. Revisa asignaciones activas y genera alertas pendientes de caducidad o retirada.")
    public RevisionCaducidadesResponse revisarCaducidades() {
        return alertaOperativaService.revisarCaducidades();
    }

    @PostMapping(value = "/alertas/revisar-trabajadores-no-disponibles", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Revisar trabajadores no disponibles", description = "Requiere ADMIN/SUPERADMIN. Genera alertas para estanterias con trabajadores asignados ausentes o enfermos.")
    public RevisionTrabajadoresNoDisponiblesResponse revisarTrabajadoresNoDisponibles() {
        return alertaOperativaService.revisarTrabajadoresNoDisponiblesAsignados();
    }

    @PatchMapping(value = "/alertas/{id}/resolver", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Resolver alerta", description = "Requiere ADMIN/SUPERADMIN. Cierra la alerta como resuelta sin modificar tareas.")
    public AlertaResponse resolverAlerta(@PathVariable Long id) {
        return alertaOperativaService.resolverAlerta(id);
    }

    @PatchMapping(value = "/alertas/{id}/descartar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(summary = "Descartar alerta", description = "Requiere ADMIN/SUPERADMIN. Cierra la alerta como descartada sin modificar tareas.")
    public AlertaResponse descartarAlerta(@PathVariable Long id) {
        return alertaOperativaService.descartarAlerta(id);
    }

    @PatchMapping(value = "/notificaciones-alerta/{alertaTrabajadorId}/leer", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Marcar notificacion de alerta como leida", description = "Requiere autenticacion. Marca una notificacion de alerta de trabajador como leida.")
    public AlertaTrabajadorResponse marcarNotificacionComoLeida(@PathVariable Long alertaTrabajadorId) {
        return alertaOperativaService.marcarNotificacionComoLeida(alertaTrabajadorId);
    }
}
