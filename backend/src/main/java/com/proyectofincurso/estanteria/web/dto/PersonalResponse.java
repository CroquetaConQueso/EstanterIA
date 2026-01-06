package com.proyectofincurso.estanteria.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter

public class PersonalResponse {
    private String message;
    private String normalizedName;
    private int age;
}
