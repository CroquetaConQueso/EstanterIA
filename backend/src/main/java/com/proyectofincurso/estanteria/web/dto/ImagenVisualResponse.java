package com.proyectofincurso.estanteria.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ImagenVisualResponse {
    private String nombreArchivo;
    private String ruta;
}
