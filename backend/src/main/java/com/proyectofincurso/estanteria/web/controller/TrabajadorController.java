package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.AlertaTrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorActivoResponse;
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
public class TrabajadorController {

    private final AlertaOperativaService alertaOperativaService;
    private final TrabajadorRepository trabajadorRepository;

    @GetMapping(value = "/activos", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<TrabajadorActivoResponse> listarTrabajadoresActivos() {
        return trabajadorRepository.findByActivoTrueOrderByApellidosAscNombreAsc()
                .stream()
                .map(this::toTrabajadorActivoResponse)
                .toList();
    }

    @GetMapping(value = "/{trabajadorId}/alertas", produces = MediaType.APPLICATION_JSON_VALUE)
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
