package com.proyectofincurso.estanteria.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImagenVisualResponse {
    private String nombreArchivo;
    private String ruta;
}
