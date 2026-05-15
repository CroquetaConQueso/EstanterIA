package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.PlanoService;
import com.proyectofincurso.estanteria.service.PlanoOperativoService;
import com.proyectofincurso.estanteria.web.dto.ActualizarPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.CrearPlanoRequest;
import com.proyectofincurso.estanteria.web.dto.PlanoOperativoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResumenResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PlanoController {

    private final PlanoService planoService;
    private final PlanoOperativoService planoOperativoService;

    @GetMapping(value = "/api/empresas/{codigoEmpresa}/planos", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<PlanoResumenResponse> listarPlanosDeEmpresa(@PathVariable String codigoEmpresa) {
        return planoService.listarPlanosDeEmpresa(codigoEmpresa);
    }

    @GetMapping(value = "/api/planos/{codigo}", produces = MediaType.APPLICATION_JSON_VALUE)
    public PlanoResponse obtenerPlano(@PathVariable String codigo) {
        return planoService.obtenerPlanoCompleto(codigo);
    }

    @GetMapping(value = "/api/planos/{codigo}/operativo", produces = MediaType.APPLICATION_JSON_VALUE)
    public PlanoOperativoResponse obtenerPlanoOperativo(@PathVariable String codigo) {
        return planoOperativoService.obtenerPlanoOperativo(codigo);
    }

    @PostMapping(value = "/api/planos", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PlanoResponse crearPlano(@Valid @RequestBody CrearPlanoRequest request) {
        return planoService.crearPlano(request);
    }

    @PutMapping(value = "/api/planos/{codigo}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public PlanoResponse actualizarPlano(@PathVariable String codigo,
                                         @Valid @RequestBody ActualizarPlanoRequest request) {
        return planoService.actualizarPlanoCompleto(codigo, request);
    }
}
