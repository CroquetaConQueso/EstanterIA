package com.proyectofincurso.estanteria.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PersonalRequest {
    @NotBlank(message= "El nombre es obligatorio")
    private String userName;

    @Min(value=0 , message = "La edad no puede ser negativa")
    @Max(value=100, message = "La edad parece invalida (max 100)")
    private int userAge;
    
    public PersonalRequest(){}

    public PersonalRequest(String name, int age){
        this.userName = name;
        this.userAge = age;
    }

    
}
