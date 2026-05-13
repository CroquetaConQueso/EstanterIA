package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.EstanteriaConfiguracionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estanterias")
@RequiredArgsConstructor
public class EstanteriaController {

    private final ModeloOperativoService modeloOperativoService;

    @GetMapping(value = "/{codigo}/configuracion", produces = MediaType.APPLICATION_JSON_VALUE)
    public EstanteriaConfiguracionResponse obtenerConfiguracion(@PathVariable String codigo) {
        return modeloOperativoService.obtenerConfiguracionDeEstanteria(codigo);
    }
}
