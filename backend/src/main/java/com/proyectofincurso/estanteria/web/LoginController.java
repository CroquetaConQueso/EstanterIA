package com.proyectofincurso.estanteria.web;

import com.proyectofincurso.estanteria.web.dto.LoginRequest;
import com.proyectofincurso.estanteria.web.dto.LoginResponse;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api")
public class LoginController {

    @PostMapping (value="/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public LoginResponse login(@Valid @RequestBody LoginRequest req){
        String username = req.getUserName();
        String userpass = req.getUserPassword();

        return new LoginResponse("Los datos son validos", username, userpass);
    }
}
