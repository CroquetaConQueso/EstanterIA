package com.proyectofincurso.estanteria.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_BEARER = "bearerAuth";

    @Bean
    public OpenAPI estanteriaOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("EstanterIA API")
                        .description("API REST para gestion operativa de estanterias, inspecciones, planos, alertas y tareas.")
                        .version("0.5.0"))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_BEARER))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_BEARER, new SecurityScheme()
                                .name(SECURITY_SCHEME_BEARER)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
