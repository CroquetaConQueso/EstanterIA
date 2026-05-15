package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ModeloOperativoService modeloOperativoService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ProductoResumenResponse> listarProductosActivos() {
        return modeloOperativoService.obtenerProductosActivos();
    }
}
