package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.AlertaResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaTrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.EvaluacionCaducidadResponse;
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
public class AlertaController {

    private final AlertaOperativaService alertaOperativaService;

    @GetMapping(value = "/alertas/abiertas", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<AlertaResponse> obtenerAlertasAbiertas() {
        return alertaOperativaService.obtenerAlertasAbiertas();
    }

    @PostMapping(value = "/alertas/evaluar-caducidad", produces = MediaType.APPLICATION_JSON_VALUE)
    public EvaluacionCaducidadResponse evaluarCaducidad() {
        return alertaOperativaService.evaluarCaducidad();
    }

    @PatchMapping(value = "/alertas/{id}/resolver", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public AlertaResponse resolverAlerta(@PathVariable Long id) {
        return alertaOperativaService.resolverAlerta(id);
    }

    @PatchMapping(value = "/alertas/{id}/descartar", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public AlertaResponse descartarAlerta(@PathVariable Long id) {
        return alertaOperativaService.descartarAlerta(id);
    }

    @PatchMapping(value = "/notificaciones-alerta/{alertaTrabajadorId}/leer", produces = MediaType.APPLICATION_JSON_VALUE)
    public AlertaTrabajadorResponse marcarNotificacionComoLeida(@PathVariable Long alertaTrabajadorId) {
        return alertaOperativaService.marcarNotificacionComoLeida(alertaTrabajadorId);
    }
}
