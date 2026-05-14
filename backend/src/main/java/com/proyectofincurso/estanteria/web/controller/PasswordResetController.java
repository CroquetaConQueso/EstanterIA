package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.PasswordResetService;
import com.proyectofincurso.estanteria.web.dto.ForgotPasswordRequest;
import com.proyectofincurso.estanteria.web.dto.ForgotPasswordResponse;
import com.proyectofincurso.estanteria.web.dto.ResetPasswordRequest;
import com.proyectofincurso.estanteria.web.dto.ResetPasswordValidateResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping(value = "/forgot-password", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ForgotPasswordResponse solicitarRecuperacion(@Valid @RequestBody ForgotPasswordRequest request) {
        return new ForgotPasswordResponse(passwordResetService.solicitarRecuperacion(request.email()));
    }

    @GetMapping(value = "/reset-password/validate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResetPasswordValidateResponse validarToken(@RequestParam String token) {
        boolean valid = passwordResetService.tokenValido(token);
        String message = valid ? "El enlace de recuperación es válido" : "El enlace de recuperación no es válido o ha caducado";
        return new ResetPasswordValidateResponse(valid, message);
    }

    @PostMapping(value = "/reset-password", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ForgotPasswordResponse restablecerPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.restablecerPassword(request.token(), request.password(), request.confirmPassword());
        return new ForgotPasswordResponse("La contraseña se ha actualizado correctamente.");
    }
}
