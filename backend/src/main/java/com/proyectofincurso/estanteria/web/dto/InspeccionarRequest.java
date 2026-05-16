package com.proyectofincurso.estanteria.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Solicitud para registrar una inspeccion manual")
public class InspeccionarRequest {

    @NotBlank(message = "El código de estantería es obligatorio")
    @Size(min = 5, max = 50, message = "El código debe tener entre 5 y 50 caracteres")
    private String estanteriaCodigo;

    @Size(max = 1000, message = "Las notas no pueden superar 1000 caracteres")
    private String notas;

    @Size(max = 500, message = "La ruta de imagen no puede superar 500 caracteres")
    private String imagenPath;
}
