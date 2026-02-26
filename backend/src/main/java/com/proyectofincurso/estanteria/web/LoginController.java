package com.proyectofincurso.estanteria.web;

import com.proyectofincurso.estanteria.auth.AuthService;
import com.proyectofincurso.estanteria.auth.AuthUser;
import com.proyectofincurso.estanteria.auth.SessionService;
import com.proyectofincurso.estanteria.web.dto.LoginRequest;
import com.proyectofincurso.estanteria.web.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LoginController {

    private final AuthService authService;
    private final SessionService sessionService;

    public LoginController(AuthService authService, SessionService sessionService) {
        this.authService = authService;
        this.sessionService = sessionService;
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        AuthUser user = authService.authenticate(req.getUserName(), req.getUserPassword());
        String token = sessionService.createSession(user);
        return new LoginResponse("LOGIN_OK", user.userName(), user.role(), token);
    }
}