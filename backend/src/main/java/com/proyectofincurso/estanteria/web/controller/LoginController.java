package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.auth.AuthSessionService;
import com.proyectofincurso.estanteria.auth.AuthService;
import com.proyectofincurso.estanteria.auth.AuthUser;
import com.proyectofincurso.estanteria.auth.JwtTokenService;
import com.proyectofincurso.estanteria.persistence.entity.AuthSession;
import com.proyectofincurso.estanteria.web.dto.LoginRequest;
import com.proyectofincurso.estanteria.web.dto.LoginResponse;
import com.proyectofincurso.estanteria.web.dto.LogoutResponse;
import com.proyectofincurso.estanteria.web.dto.RegistroResponse;
import com.proyectofincurso.estanteria.web.dto.RegistroRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LoginController {

    private final AuthService authService;
    private final JwtTokenService jwtTokenService;
    private final AuthSessionService authSessionService;

    public LoginController(AuthService authService, JwtTokenService jwtTokenService, AuthSessionService authSessionService) {
        this.authService = authService;
        this.jwtTokenService = jwtTokenService;
        this.authSessionService = authSessionService;
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        AuthUser user = authService.authenticate(req.getEmail(), req.getPassword());
        AuthSession session = authSessionService.crearSesion(user);
        String token = jwtTokenService.emitirToken(user, session.getSessionId(), session.getExpiresAt());
        return new LoginResponse("LOGIN_OK", user.userName(), user.role(), token);
    }

    @PostMapping(value = "/logout", produces = MediaType.APPLICATION_JSON_VALUE)
    public LogoutResponse logout(@AuthenticationPrincipal Jwt jwt) {
        authSessionService.revocarSesion(jwt.getClaimAsString("sid"));
        return new LogoutResponse("LOGOUT_OK");
    }

    @PostMapping(value = "/registro", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public RegistroResponse registro(@Valid @RequestBody RegistroRequest req) {
        authService.verificar(req.getUsername(),req.getEmail(), req.getPassword());
        return new RegistroResponse("REGISTRO_OK");
    }
}
