package com.proyectofincurso.estanteria.persistence.entity;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;
public class InspeccionarRequest {
    
    @NotBlank(message = "El código es obligatorio")
    @Min(5)
    @Max(50)
    private String estanteriaCodigo;

    private String notas;

    private String imagenPath;

}
