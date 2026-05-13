package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.EmpresaResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/empresas")
@RequiredArgsConstructor
public class EmpresaController {

    private final ModeloOperativoService modeloOperativoService;

    @GetMapping(value = "/{codigo}", produces = MediaType.APPLICATION_JSON_VALUE)
    public EmpresaResponse obtenerEmpresa(@PathVariable String codigo) {
        return modeloOperativoService.obtenerEmpresaActivaPorCodigo(codigo);
    }

    @GetMapping(value = "/{codigoEmpresa}/secciones", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<SeccionResponse> obtenerSecciones(@PathVariable String codigoEmpresa) {
        return modeloOperativoService.obtenerSeccionesDeEmpresa(codigoEmpresa);
    }
}
