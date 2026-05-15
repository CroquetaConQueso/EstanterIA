package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.AlertaResponse;
import com.proyectofincurso.estanteria.web.dto.ActualizarSeccionRequest;
import com.proyectofincurso.estanteria.web.dto.AsignarResponsablePrincipalRequest;
import com.proyectofincurso.estanteria.web.dto.CrearSeccionRequest;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResponsableResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
@RequestMapping("/api/secciones")
@RequiredArgsConstructor
public class SeccionController {

    private final ModeloOperativoService modeloOperativoService;
    private final AlertaOperativaService alertaOperativaService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public SeccionResponse crearSeccion(@Valid @RequestBody CrearSeccionRequest request) {
        return modeloOperativoService.crearSeccion(request);
    }

    @PatchMapping(value = "/{seccionId}", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public SeccionResponse actualizarSeccion(@PathVariable Long seccionId,
                                             @Valid @RequestBody ActualizarSeccionRequest request) {
        return modeloOperativoService.actualizarSeccion(seccionId, request);
    }

    @PatchMapping(value = "/{seccionId}/responsable-principal", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public PlanoResponsableResponse asignarResponsablePrincipal(@PathVariable Long seccionId,
                                                                @Valid @RequestBody AsignarResponsablePrincipalRequest request) {
        return modeloOperativoService.asignarResponsablePrincipal(seccionId, request.trabajadorId());
    }

    @GetMapping(value = "/{seccionId}/estanterias", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<EstanteriaResumenResponse> obtenerEstanterias(@PathVariable Long seccionId) {
        return modeloOperativoService.obtenerEstanteriasDeSeccion(seccionId);
    }

    @GetMapping(value = "/{seccionId}/alertas/abiertas", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<AlertaResponse> obtenerAlertasAbiertas(@PathVariable Long seccionId) {
        return alertaOperativaService.obtenerAlertasAbiertasDeSeccion(seccionId);
    }
}
