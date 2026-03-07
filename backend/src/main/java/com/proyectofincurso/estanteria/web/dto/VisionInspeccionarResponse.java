package com.proyectofincurso.estanteria.web.dto;

import java.time.Instant;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VisionInspeccionarResponse {
    private String message;
    private Long id;
    private String estanteriaCodigo;
    private String imagePath;
    private String imageUrl;
    private Map<String, Integer> summary;
    private Instant createdAt;
    private boolean critical;
}