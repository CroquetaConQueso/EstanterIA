package com.proyectofincurso.estanteria.config;

import java.io.IOException;
import java.nio.file.Files;
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

    @Value("${app.captures-dir:captures}")
    private String capturesDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            Path capturesPath = Paths.get(capturesDir).toAbsolutePath().normalize();
            Files.createDirectories(capturesPath);

            String resourceLocation = capturesPath.toUri().toString();
            if (!resourceLocation.endsWith("/")) {
                resourceLocation = resourceLocation + "/";
            }

            log.info("Sirviendo capturas desde: {}", resourceLocation);

            registry.addResourceHandler("/captures/**")
                    .addResourceLocations(resourceLocation);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo inicializar el directorio de capturas: " + capturesDir, e);
        }
    }
}