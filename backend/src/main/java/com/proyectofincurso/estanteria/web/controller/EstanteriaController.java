package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.ActualizarEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.CrearEstanteriaRequest;
import com.proyectofincurso.estanteria.web.dto.EstanteriaConfiguracionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estanterias")
@RequiredArgsConstructor
public class EstanteriaController {

    private final ModeloOperativoService modeloOperativoService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public EstanteriaConfiguracionResponse crearEstanteria(@Valid @RequestBody CrearEstanteriaRequest request) {
        return modeloOperativoService.crearEstanteria(request);
    }

    @PatchMapping(value = "/{codigo}", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    public EstanteriaConfiguracionResponse actualizarEstanteria(@PathVariable String codigo,
                                                                @Valid @RequestBody ActualizarEstanteriaRequest request) {
        return modeloOperativoService.actualizarEstanteria(codigo, request);
    }

    @GetMapping(value = "/{codigo}/configuracion", produces = MediaType.APPLICATION_JSON_VALUE)
    public EstanteriaConfiguracionResponse obtenerConfiguracion(@PathVariable String codigo) {
        return modeloOperativoService.obtenerConfiguracionDeEstanteria(codigo);
    }
}
