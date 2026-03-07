package com.proyectofincurso.estanteria.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path capturesPath = Paths.get("vision", "data", "raw").toAbsolutePath().normalize();

        registry.addResourceHandler("/captures/**")
                .addResourceLocations("file:" + capturesPath.toString() + "/");
    }
}