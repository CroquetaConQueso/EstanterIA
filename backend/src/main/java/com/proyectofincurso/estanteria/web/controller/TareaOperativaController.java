package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.TareaOperativaService;
import com.proyectofincurso.estanteria.web.dto.TareaAsignarRequest;
import com.proyectofincurso.estanteria.web.dto.TareaEstadoRequest;
import com.proyectofincurso.estanteria.web.dto.TareaOperativaResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tareas")
@RequiredArgsConstructor
public class TareaOperativaController {

    private final TareaOperativaService tareaOperativaService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<TareaOperativaResponse> obtenerTareas() {
        return tareaOperativaService.obtenerTareas();
    }

    @GetMapping(value = "/pendientes", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<TareaOperativaResponse> obtenerTareasPendientes() {
        return tareaOperativaService.obtenerTareasPendientes();
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public TareaOperativaResponse obtenerDetalle(@PathVariable Long id) {
        return tareaOperativaService.obtenerDetalle(id);
    }

    @PatchMapping(value = "/{id}/asignar", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public TareaOperativaResponse asignarTrabajador(@PathVariable Long id,
                                                    @Valid @RequestBody TareaAsignarRequest request) {
        return tareaOperativaService.asignarTrabajador(id, request.trabajadorId());
    }

    @PatchMapping(value = "/{id}/estado", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public TareaOperativaResponse cambiarEstado(@PathVariable Long id,
                                                @Valid @RequestBody TareaEstadoRequest request) {
        return tareaOperativaService.cambiarEstado(id, request.estado());
    }
}
