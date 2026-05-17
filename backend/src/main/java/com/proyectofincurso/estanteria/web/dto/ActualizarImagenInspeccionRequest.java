package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Solicitud para asociar, cambiar o quitar la imagen de evidencia de una inspeccion.")
public record ActualizarImagenInspeccionRequest(
        @Schema(description = "Ruta publica /captures/...; null o blanco quita la imagen asociada", example = "/captures/EST-001/capture_20260517_120000.jpg")
        String imagenPath
) {
}
