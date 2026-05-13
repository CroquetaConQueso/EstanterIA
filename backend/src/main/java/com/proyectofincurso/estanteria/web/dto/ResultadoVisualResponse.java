package com.proyectofincurso.estanteria.web.dto;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResultadoVisualResponse {
    private String estanteriaCodigo;
    private String modeloVersion;
    private Instant capturadaEn;
    private ImagenVisualResponse imagen;
    private ResumenVisualResponse resumen;
    private List<SlotVisualResponse> slots;
}
