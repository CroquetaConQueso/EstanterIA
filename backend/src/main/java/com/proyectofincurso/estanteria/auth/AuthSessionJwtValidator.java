package com.proyectofincurso.estanteria.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthSessionJwtValidator implements OAuth2TokenValidator<Jwt> {

    private final AuthSessionService authSessionService;

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        String sessionId = token.getClaimAsString("sid");
        Long userId = extraerUserId(token.getClaim("userId"));

        AuthSessionValidationResult result = authSessionService.validarSesionJwt(sessionId, userId);
        if (result.valid()) {
            return OAuth2TokenValidatorResult.success();
        }

        return OAuth2TokenValidatorResult.failure(new OAuth2Error(
                "invalid_token",
                result.message(),
                null
        ));
    }

    private Long extraerUserId(Object claim) {
        if (claim instanceof Number number) {
            return number.longValue();
        }

        if (claim instanceof String text && !text.isBlank()) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        return null;
    }
}
