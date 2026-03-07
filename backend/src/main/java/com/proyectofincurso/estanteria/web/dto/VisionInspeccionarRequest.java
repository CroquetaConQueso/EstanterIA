package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VisionInspeccionarRequest {

    @NotBlank(message = "El modo es obligatorio")
    private String modo;

    private String imagePath;

    private String notas;
}