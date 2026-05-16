package com.proyectofincurso.estanteria.web.controller;

import com.proyectofincurso.estanteria.service.PasswordResetService;
import com.proyectofincurso.estanteria.web.dto.ForgotPasswordRequest;
import com.proyectofincurso.estanteria.web.dto.ForgotPasswordResponse;
import com.proyectofincurso.estanteria.web.dto.ResetPasswordRequest;
import com.proyectofincurso.estanteria.web.dto.ResetPasswordValidateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Recuperacion de password", description = "Solicitud, validacion y cambio de password")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping(value = "/forgot-password", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Solicitar recuperacion", description = "Endpoint publico. Genera el flujo de recuperacion de password para un email.")
    public ForgotPasswordResponse solicitarRecuperacion(@Valid @RequestBody ForgotPasswordRequest request) {
        return new ForgotPasswordResponse(passwordResetService.solicitarRecuperacion(request.email()));
    }

    @GetMapping(value = "/reset-password/validate", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Validar token de recuperacion", description = "Endpoint publico. Comprueba si un token de recuperacion sigue siendo valido.")
    public ResetPasswordValidateResponse validarToken(@RequestParam String token) {
        boolean valid = passwordResetService.tokenValido(token);
        String message = valid ? "El enlace de recuperación es válido" : "El enlace de recuperación no es válido o ha caducado";
        return new ResetPasswordValidateResponse(valid, message);
    }

    @PostMapping(value = "/reset-password", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Restablecer password", description = "Endpoint publico. Cambia el password usando un token de recuperacion valido.")
    public ForgotPasswordResponse restablecerPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.restablecerPassword(request.token(), request.password(), request.confirmPassword());
        return new ForgotPasswordResponse("La contraseña se ha actualizado correctamente.");
    }
}
