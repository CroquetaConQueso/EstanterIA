package com.proyectofincurso.estanteria.web.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.CapturaService;
import com.proyectofincurso.estanteria.web.dto.CapturaResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Capturas", description = "Capturas disponibles para inspecciones")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class CapturaController {

    private final CapturaService capturaService;

    public CapturaController(CapturaService capturaService) {
        this.capturaService = capturaService;
    }

    @GetMapping(value = "/capturas", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Listar capturas", description = "Requiere autenticacion. Devuelve capturas disponibles sin exponer rutas fisicas.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Capturas disponibles devueltas"),
            @ApiResponse(responseCode = "400", description = "Codigo de estanteria invalido"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "503", description = "Directorio de capturas no disponible")
    })
    public List<CapturaResponse> listarCapturas(
            @Parameter(description = "Codigo de estanteria para limitar la busqueda de capturas")
            @RequestParam(value = "estanteriaCodigo", required = false) String estanteriaCodigo
    ) {
        return capturaService.listarCapturas(estanteriaCodigo);
    }
}
