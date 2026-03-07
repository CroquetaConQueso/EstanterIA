package com.proyectofincurso.estanteria.integration.vision.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VisionCapturePredictRequest {
    private String estanteriaCodigo;
}