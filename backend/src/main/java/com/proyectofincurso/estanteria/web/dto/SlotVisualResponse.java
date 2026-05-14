package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.EstadoVisualSlot;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SlotVisualResponse {
    private String slotId;
    private Integer orden;
    private EstadoVisualSlot estadoVisual;
    private Double confianza;
}
