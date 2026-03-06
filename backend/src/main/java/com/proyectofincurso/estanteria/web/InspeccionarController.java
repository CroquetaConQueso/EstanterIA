package com.proyectofincurso.estanteria.web;

import com.proyectofincurso.estanteria.service.InspeccionService;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api")
public class InspeccionarController {
    private final InspeccionService inspeccionService;
    

    public InspeccionarController(InspeccionService iser){
        this.inspeccionService = iser;
    }

    @PostMapping(value="/inspeccion_nueva", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionarResponse inspeccionar(@Valid @RequestBody InspeccionarRequest req){
        return inspeccionService.crearInspeccion(req.getEstanteriaCodigo(), req.getNotas(), req.getImagenPath());
        
    }
    
    @GetMapping(value="/inspecciones")
    public List<InspeccionItemResponse> getMethodName(@RequestParam String param) {
        return inspeccionService.obtenerInspecciones();
    }
    
}
