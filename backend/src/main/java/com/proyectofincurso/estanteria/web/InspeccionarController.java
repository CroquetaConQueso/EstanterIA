package com.proyectofincurso.estanteria.web;

import com.proyectofincurso.estanteria.service.InspeccionarService;
import com.proyectofincurso.estanteria.web.dto.InspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InspeccionarController {
    private final InspeccionarService inspeccionarService;
    

    public InspeccionarController(InspeccionarService iser){
        this.inspeccionarService = iser;
    }

    @PostMapping(value="/inspeccion_nueva", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public InspeccionarResponse inspeccionar(@Valid @RequestBody InspeccionarRequest req){
        return inspeccionarService.crearInspeccion(req.getEstanteriaCodigo(), req.getNotas(), req.getImagenPath());
        
    }
}
