package com.proyectofincurso.estanteria.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.proyectofincurso.estanteria.service.VisionInspeccionService;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@AllArgsConstructor
@Controller
@RequestMapping("/api")
public class VisionController {
    private final VisionInspeccionService visSer;
    
    @GetMapping("")
    public String getMethodName(@RequestParam String param) {
        return visSer.obtenerVisiones();
    }
    
}
