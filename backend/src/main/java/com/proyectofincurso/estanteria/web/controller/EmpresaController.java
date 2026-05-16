package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.ModeloOperativoService;
import com.proyectofincurso.estanteria.web.dto.EmpresaResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Modelo operativo", description = "Empresa y secciones operativas")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class EmpresaController {

    private final ModeloOperativoService modeloOperativoService;

    @GetMapping(value = "/{codigo}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Obtener empresa", description = "Requiere autenticacion. Devuelve una empresa activa por codigo.")
    public EmpresaResponse obtenerEmpresa(@PathVariable String codigo) {
        return modeloOperativoService.obtenerEmpresaActivaPorCodigo(codigo);
    }

    @GetMapping(value = "/{codigoEmpresa}/secciones", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar secciones de empresa", description = "Requiere autenticacion. Devuelve secciones activas de una empresa.")
    public List<SeccionResponse> obtenerSecciones(@PathVariable String codigoEmpresa) {
        return modeloOperativoService.obtenerSeccionesDeEmpresa(codigoEmpresa);
    }
}
