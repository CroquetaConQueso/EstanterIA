package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.config.OpenApiConfig;
import com.proyectofincurso.estanteria.service.InformeRotacionVisualPdfService;
import com.proyectofincurso.estanteria.service.InformeRotacionVisualService;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/informes")
@RequiredArgsConstructor
@Tag(name = "Informes", description = "Informes operativos basados en inspecciones visuales")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_BEARER)
public class InformeController {

    private final InformeRotacionVisualService informeRotacionVisualService;
    private final InformeRotacionVisualPdfService informeRotacionVisualPdfService;

    @GetMapping(value = "/rotacion-visual", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(
            summary = "Informe de rotacion visual",
            description = "Requiere ADMIN/SUPERADMIN. Analiza vacios detectados en inspecciones visuales; no calcula ventas reales."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Informe generado en JSON"),
            @ApiResponse(responseCode = "400", description = "Filtros o rango de fechas invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Plano, seccion o estanteria inexistente")
    })
    public InformeRotacionVisualResponse obtenerInformeRotacionVisual(
            @Parameter(description = "Codigo de plano a usar como filtro opcional")
            @RequestParam(required = false) String planoCodigo,
            @Parameter(description = "Identificador de seccion a usar como filtro opcional")
            @RequestParam(required = false) Long seccionId,
            @Parameter(description = "Codigo de estanteria a usar como filtro opcional")
            @RequestParam(required = false) String estanteriaCodigo,
            @Parameter(description = "Fecha inicial del periodo analizado")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @Parameter(description = "Fecha final del periodo analizado")
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

    @GetMapping(value = "/rotacion-visual/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPERADMIN')")
    @Operation(
            summary = "Exportar informe de rotacion visual en PDF",
            description = "Requiere ADMIN/SUPERADMIN. Genera un PDF del informe de vacios detectados; no calcula ventas reales."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PDF generado"),
            @ApiResponse(responseCode = "400", description = "Filtros o rango de fechas invalidos"),
            @ApiResponse(responseCode = "401", description = "No autenticado"),
            @ApiResponse(responseCode = "403", description = "Sin permisos"),
            @ApiResponse(responseCode = "404", description = "Plano, seccion o estanteria inexistente")
    })
    public ResponseEntity<byte[]> descargarInformeRotacionVisualPdf(
            @Parameter(description = "Codigo de plano a usar como filtro opcional")
            @RequestParam(required = false) String planoCodigo,
            @Parameter(description = "Identificador de seccion a usar como filtro opcional")
            @RequestParam(required = false) Long seccionId,
            @Parameter(description = "Codigo de estanteria a usar como filtro opcional")
            @RequestParam(required = false) String estanteriaCodigo,
            @Parameter(description = "Fecha inicial del periodo analizado")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @Parameter(description = "Fecha final del periodo analizado")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        // El PDF se genera desde el mismo DTO que el JSON para evitar metricas divergentes entre formatos.
        InformeRotacionVisualResponse informe = informeRotacionVisualService.generarInforme(
                planoCodigo,
                seccionId,
                estanteriaCodigo,
                fechaDesde,
                fechaHasta
        );
        byte[] pdf = informeRotacionVisualPdfService.generarPdf(informe);
        String filename = "informe-rotacion-visual-" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }
}
