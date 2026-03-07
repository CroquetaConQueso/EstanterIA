package com.proyectofincurso.estanteria.integration.vision.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VisionPredictRequest {
    private String imagePath;
}
