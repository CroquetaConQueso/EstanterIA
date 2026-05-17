package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.InformeRotacionVisualService;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/informes")
@RequiredArgsConstructor
@Tag(name = "Informes", description = "Informes operativos basados en inspecciones visuales")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class InformeController {

    private final InformeRotacionVisualService informeRotacionVisualService;

    @GetMapping(value = "/rotacion-visual", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(
            summary = "Informe de rotacion visual",
            description = "Requiere ADMIN/SUPERADMIN. Analiza vacios detectados en inspecciones visuales; no calcula ventas reales."
    )
    public InformeRotacionVisualResponse obtenerInformeRotacionVisual(
            @RequestParam(required = false) String planoCodigo,
            @RequestParam(required = false) Long seccionId,
            @RequestParam(required = false) String estanteriaCodigo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        return informeRotacionVisualService.generarInforme(
                planoCodigo,
                seccionId,
                estanteriaCodigo,
                fechaDesde,
                fechaHasta
        );
    }
}
