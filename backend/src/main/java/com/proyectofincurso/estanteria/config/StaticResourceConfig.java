package com.proyectofincurso.estanteria.config;

import java.nio.file.Path;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.proyectofincurso.estanteria.integration.vision.CapturePathNormalizer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path capturesPath = CapturePathNormalizer.resolveCapturesRoot();

        registry.addResourceHandler("/captures/**")
                .addResourceLocations(toDirectoryResourceLocation(capturesPath));
    }

    private static String toDirectoryResourceLocation(Path path) {
        String location = path.toUri().toString();
        return location.endsWith("/") ? location : location + "/";
    }
}
