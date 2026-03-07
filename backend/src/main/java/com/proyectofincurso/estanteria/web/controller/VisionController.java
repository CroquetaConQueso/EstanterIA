package com.proyectofincurso.estanteria.web.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import com.proyectofincurso.estanteria.service.VisionService;
import com.proyectofincurso.estanteria.web.dto.VisionInspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.VisionInspeccionarResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VisionController {

    private final VisionService visionService;

    @PostMapping(
            value = "/vision/inspeccionar/{estanteriaCodigo}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public VisionInspeccionarResponse inspeccionarConVision(
            @PathVariable String estanteriaCodigo,
            @Valid @RequestBody VisionInspeccionarRequest request
    ) {
        return visionService.inspeccionarConVision(estanteriaCodigo, request);
    }
}