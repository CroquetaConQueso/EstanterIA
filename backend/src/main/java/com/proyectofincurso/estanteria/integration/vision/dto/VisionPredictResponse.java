package com.proyectofincurso.estanteria.integration.vision.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class VisionPredictResponse {

    @JsonProperty("image_name")
    private String imageName;

    @JsonProperty("image_path")
    private String imagePath;

    private Map<String, Integer> summary;

    private Boolean critical;
}