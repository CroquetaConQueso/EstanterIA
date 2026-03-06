package com.proyectofincurso.estanteria.web.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
@Data
public class InspeccionarRequest {
    @NotBlank(message = "El código es obligatorio")
    @Size(min = 5, max = 50, message = "El código debe tener entre 5 y 50 caracteres")
    private String estanteriaCodigo;

    private String notas;

    private String imagenPath;

}
