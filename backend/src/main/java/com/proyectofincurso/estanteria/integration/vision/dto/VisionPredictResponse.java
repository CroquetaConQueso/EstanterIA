package com.proyectofincurso.estanteria.integration.vision.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VisionPredictResponse {
    private String imageName;
    private String imagePath;
    private List<VisionDetectionItemResponse> detections;
    private Map<String, Integer> summary;
    private Boolean critical;
}
