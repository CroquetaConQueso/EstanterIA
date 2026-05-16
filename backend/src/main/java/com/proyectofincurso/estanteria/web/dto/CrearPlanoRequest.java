package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(description = "Payload para crear un plano 2D persistente")
public record CrearPlanoRequest(
        @NotBlank(message = "El codigo de empresa es obligatorio")
        @Size(max = 50, message = "El codigo de empresa no puede superar 50 caracteres")
        String empresaCodigo,

        @NotBlank(message = "El codigo del plano es obligatorio")
        @Size(max = 50, message = "El codigo del plano no puede superar 50 caracteres")
        String codigo,

        @NotBlank(message = "El nombre del plano es obligatorio")
        @Size(max = 150, message = "El nombre del plano no puede superar 150 caracteres")
        String nombre,

        String descripcion,

        @NotNull(message = "El ancho del plano es obligatorio")
        @Positive(message = "El ancho del plano debe ser mayor que cero")
        Double ancho,

        @NotNull(message = "El alto del plano es obligatorio")
        @Positive(message = "El alto del plano debe ser mayor que cero")
        Double alto,

        List<@Valid PlanoZonaRequest> zonas,

        List<@Valid PlanoEstanteriaLayoutRequest> estanterias
) {
}
