package com.proyectofincurso.estanteria.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@Slf4j
public class CapturesResourceConfig implements WebMvcConfigurer {

    @Value("${app.captures-dir:}")
    private String capturesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (capturesDir == null || capturesDir.isBlank()) {
            log.warn("app.captures-dir no está configurado. No se registrará /captures/**");
            return;
        }

        try {
            Path capturesPath = Paths.get(capturesDir).toAbsolutePath().normalize();
            String resourceLocation = capturesPath.toUri().toString();

            if (!resourceLocation.endsWith("/")) {
                resourceLocation = resourceLocation + "/";
            }

            log.info("Captures dir configurado: {}", capturesDir);
            log.info("Captures dir absoluto: {}", capturesPath);
            log.info("Resource location publicada: {}", resourceLocation);

            registry.addResourceHandler("/captures/**")
                    .addResourceLocations(resourceLocation);
        } catch (Exception e) {
            log.error("No se pudo registrar /captures/** con app.captures-dir={}", capturesDir, e);
        }
    }
}