package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/secciones")
@RequiredArgsConstructor
public class SeccionController {

    private final ModeloOperativoService modeloOperativoService;

    @GetMapping(value = "/{seccionId}/estanterias", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<EstanteriaResumenResponse> obtenerEstanterias(@PathVariable Long seccionId) {
        return modeloOperativoService.obtenerEstanteriasDeSeccion(seccionId);
    }
}
