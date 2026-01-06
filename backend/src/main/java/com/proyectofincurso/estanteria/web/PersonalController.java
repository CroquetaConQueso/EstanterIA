package com.proyectofincurso.estanteria.web;

import com.proyectofincurso.estanteria.web.dto.PersonalRequest;
import com.proyectofincurso.estanteria.web.dto.PersonalResponse;
import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
@RequestMapping("/api")
public class PersonalController {
    
    @PostMapping(value= "/person", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public PersonalResponse create(@Valid @RequestBody PersonalRequest req){
        String normalizedName = req.getUserName().trim();
        int age =  req.getUserAge();

        return new PersonalResponse("Los datos son validos", normalizedName,age);
    }
}
