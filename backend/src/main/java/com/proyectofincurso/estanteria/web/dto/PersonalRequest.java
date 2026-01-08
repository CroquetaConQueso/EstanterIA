package com.proyectofincurso.estanteria.web.dto;


import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Getter
@Setter
public class PersonalRequest {
    @NotBlank(message= "El nombre es obligatorio")
    private String userName;

    @NotBlank
    private String userPassword;
    
    @NotNull(message = "La edad es obligatoria")
    @Min(value=0 , message = "La edad no puede ser negativa")
    @Max(value=100, message = "La edad parece invalida (max 100)")
    private int userAge;
    


    public PersonalRequest(@JsonProperty("userName") String userName, @JsonProperty("userAge") int userAge){
        this.userName = userName;
        this.userAge = userAge;
    }
    
}
