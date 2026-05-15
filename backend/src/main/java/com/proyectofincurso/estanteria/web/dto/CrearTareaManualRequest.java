package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CrearTareaManualRequest(
        @NotNull TipoTareaOperativa tipoTarea,
        @NotNull PrioridadAlerta prioridad,
        @NotBlank @Size(max = 200) String titulo,
        @Size(max = 2000) String descripcion,
        Long seccionId,
        Long estanteriaId,
        Long slotConfiguracionId,
        Long trabajadorAsignadoId,
        Instant fechaLimite
) {
}
