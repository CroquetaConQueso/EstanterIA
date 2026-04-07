package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.InspeccionService;
import com.proyectofincurso.estanteria.web.dto.InspeccionDetailResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionUpdateRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;
import com.proyectofincurso.estanteria.web.dto.MessageResponse;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InspeccionController {

    private final InspeccionService inspeccionService;

    public InspeccionController(InspeccionService inspeccionService) {
        this.inspeccionService = inspeccionService;
    }

    @PostMapping(value = "/inspeccion_nueva", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionarResponse inspeccionar(@Valid @RequestBody InspeccionarRequest req) {
        return inspeccionService.crearInspeccion(
                req.getEstanteriaCodigo(),
                req.getNotas(),
                req.getImagenPath());
    }

    @GetMapping(value = "/inspecciones", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<InspeccionItemResponse> obtenerInspecciones() {
        return inspeccionService.obtenerInspecciones();
    }

    @GetMapping(value = "/inspecciones/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionDetailResponse obtenerInspeccionDetalle(@PathVariable Long id) {
        return inspeccionService.obtenerInspeccionDetalle(id);
    }

    @PutMapping(value = "/inspecciones/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionDetailResponse actualizarInspeccion(
            @PathVariable Long id,
            @RequestBody InspeccionUpdateRequest req) {
        return inspeccionService.actualizarInspeccion(id, req);
    }

    @DeleteMapping(value = "/inspecciones/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public MessageResponse eliminarInspeccion(@PathVariable Long id) {
        inspeccionService.eliminarInspeccion(id);
        return new MessageResponse("INSPECCION_ELIMINADA");
    }

    @PostMapping(value = { "/inspeccion_nueva",
            "/inspecciones" }, consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionarResponse inspeccionar(@Valid @RequestBody InspeccionarRequest req) {
        return inspeccionService.crearInspeccion(
                req.getEstanteriaCodigo(),
                req.getNotas(),
                req.getImagenPath());
    }

    @PutMapping(value = "/inspecciones/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionDetailResponse actualizarInspeccion(
            @PathVariable Long id,
            @Valid @RequestBody InspeccionUpdateRequest req) {
        return inspeccionService.actualizarInspeccion(id, req);
    }
}