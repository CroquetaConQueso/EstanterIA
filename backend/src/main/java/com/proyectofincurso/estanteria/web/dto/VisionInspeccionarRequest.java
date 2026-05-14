package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VisionInspeccionarRequest {

    @NotBlank(message = "El modo es obligatorio")
    private String modo;

    @Size(max = 500, message = "La ruta de imagen no puede superar 500 caracteres")
    private String imagePath;

    @Size(max = 1000, message = "Las notas no pueden superar 1000 caracteres")
    private String notas;
}
