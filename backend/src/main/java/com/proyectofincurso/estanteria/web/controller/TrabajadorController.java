package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.AlertaTrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorActivoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping(value = "/activos", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar trabajadores activos", description = "Requiere autenticacion. Devuelve trabajadores activos para asignaciones y responsables.")
    public List<TrabajadorActivoResponse> listarTrabajadoresActivos() {
        return trabajadorRepository.findByActivoTrueOrderByApellidosAscNombreAsc()
                .stream()
                .map(this::toTrabajadorActivoResponse)
                .toList();
    }

    @GetMapping(value = "/{trabajadorId}/alertas", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar alertas de trabajador", description = "Requiere autenticacion. Devuelve notificaciones de alerta asociadas a un trabajador.")
    public List<AlertaTrabajadorResponse> obtenerAlertasDeTrabajador(@PathVariable Long trabajadorId) {
        return alertaOperativaService.obtenerAlertasDeTrabajador(trabajadorId);
    }

    private TrabajadorActivoResponse toTrabajadorActivoResponse(Trabajador trabajador) {
        return new TrabajadorActivoResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getTipoTrabajador(),
                trabajador.getActivo()
        );
    }
}
