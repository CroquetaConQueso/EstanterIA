package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.auth.AuthService;
import com.proyectofincurso.estanteria.auth.AuthUser;
import com.proyectofincurso.estanteria.auth.PasswordResetService;
import com.proyectofincurso.estanteria.auth.SessionService;
import com.proyectofincurso.estanteria.web.dto.ForgotPasswordRequest;
import com.proyectofincurso.estanteria.web.dto.LoginRequest;
import com.proyectofincurso.estanteria.web.dto.LoginResponse;
import com.proyectofincurso.estanteria.web.dto.MeResponse;
import com.proyectofincurso.estanteria.web.dto.MessageResponse;
import com.proyectofincurso.estanteria.web.dto.PasswordResetValidateResponse;
import com.proyectofincurso.estanteria.web.dto.RegistroRequest;
import com.proyectofincurso.estanteria.web.dto.RegistroResponse;
import com.proyectofincurso.estanteria.web.dto.ResetPasswordRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;
    private final SessionService sessionService;
    private final PasswordResetService passwordResetService;

    public AuthController(
            AuthService authService,
            SessionService sessionService,
            PasswordResetService passwordResetService
    ) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping(
            value = {"/api/auth/login", "/api/login"},
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        AuthUser user = authService.authenticate(req.getEmail(), req.getPassword());
        String token = sessionService.createSession(user);

        return new LoginResponse(
                "LOGIN_OK",
                user.userName(),
                user.role(),
                token
        );
    }

    @PostMapping(
            value = {"/api/auth/registro", "/api/registro"},
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public RegistroResponse registro(@Valid @RequestBody RegistroRequest req) {
        authService.verificar(
                req.getUsername(),
                req.getEmail(),
                req.getPassword(),
                req.getRole()
        );

        return new RegistroResponse("REGISTRO_OK");
    }

    @PostMapping(
            value = {"/api/auth/forgot-password", "/api/forgot-password"},
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.requestPasswordRecovery(req.getEmail());
        return new MessageResponse("Si el correo existe, recibirás un enlace para restablecer tu contraseña.");
    }

    @GetMapping(value = "/api/auth/reset-password/validate", produces = MediaType.APPLICATION_JSON_VALUE)
    public PasswordResetValidateResponse validateResetToken(@RequestParam("token") String token) {
        return passwordResetService.validateResetToken(token);
    }

    @PostMapping(
            value = "/api/auth/reset-password",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return new MessageResponse("Contraseña actualizada correctamente.");
    }

    @GetMapping(value = "/api/auth/me", produces = MediaType.APPLICATION_JSON_VALUE)
    public MeResponse me(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false)
            String authorizationHeader
    ) {
        SessionService.SessionUser session = sessionService.getRequiredSession(authorizationHeader);

        return new MeResponse(
                session.userName(),
                session.email(),
                session.role(),
                session.createdAt()
        );
    }

    @PostMapping(value = "/api/auth/logout", produces = MediaType.APPLICATION_JSON_VALUE)
    public MessageResponse logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false)
            String authorizationHeader
    ) {
        sessionService.invalidateSession(authorizationHeader);
        return new MessageResponse("LOGOUT_OK");
    }
}