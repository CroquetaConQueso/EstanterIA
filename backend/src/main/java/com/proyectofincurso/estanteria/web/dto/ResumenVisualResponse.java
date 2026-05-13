package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoGeneralVisual;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResumenVisualResponse {
    private EstadoGeneralVisual estadoGeneralVisual;
    private Integer slotsTotales;
    private Integer ocupados;
    private Integer vacios;
    private Integer anomalias;
    private Boolean hayHuecosVacios;
    private Boolean hayAnomalias;
}
