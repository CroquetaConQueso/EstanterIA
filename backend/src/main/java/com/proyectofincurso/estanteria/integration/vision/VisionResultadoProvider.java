package com.proyectofincurso.estanteria.integration.vision;

import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;

public interface VisionResultadoProvider {
    ResultadoVisualResponse obtenerResultado(String estanteriaCodigo, String modo, String imagePath);
}
