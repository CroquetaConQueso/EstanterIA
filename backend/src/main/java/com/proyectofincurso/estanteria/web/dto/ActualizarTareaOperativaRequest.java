package com.proyectofincurso.estanteria.web.dto;

import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Schema(description = "Payload para editar una tarea operativa no finalizada")
public record ActualizarTareaOperativaRequest(
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
