package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.InspeccionService;
import com.proyectofincurso.estanteria.web.dto.InspeccionDetalleResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api")
public class InspeccionController {
    private final InspeccionService inspeccionService;
    

    public InspeccionController(InspeccionService iser){
        this.inspeccionService = iser;
    }

    @PostMapping(value="/inspeccion_nueva", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionarResponse inspeccionar(@Valid @RequestBody InspeccionarRequest req){
        return inspeccionService.crearInspeccion(req.getEstanteriaCodigo(), req.getNotas(), req.getImagenPath());
        
    }
    
    @GetMapping(value="/inspecciones")
    public List<InspeccionItemResponse> obtenerInspecciones() {
        return inspeccionService.obtenerInspecciones();
    }

    @GetMapping(value="/inspecciones/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionDetalleResponse obtenerInspeccion(@PathVariable Long id) {
        return inspeccionService.obtenerInspeccion(id);
    }
    
}
