package com.proyectofincurso.estanteria.config;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.proyectofincurso.estanteria.integration.vision.CapturePathNormalizer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path capturesPath = CapturePathNormalizer.resolveCapturesRoot();
        Path productsPath = resolveProductsRoot();

        registry.addResourceHandler("/captures/**")
                .addResourceLocations(toDirectoryResourceLocation(capturesPath));

        registry.addResourceHandler("/products/**")
                .addResourceLocations(toDirectoryResourceLocation(productsPath));
    }

    public static Path resolveProductsRoot() {
        Path currentDir = Paths.get("").toAbsolutePath().normalize();
        Path parentDir = currentDir.getParent();
        Path repoRoot = currentDir.getFileName() != null && "backend".equals(currentDir.getFileName().toString()) && parentDir != null
                ? currentDir.getParent()
                : currentDir;
        Path productsRoot = repoRoot.resolve(Paths.get("data", "products")).normalize();

        try {
            Files.createDirectories(productsRoot);
        } catch (IOException ex) {
            throw new UncheckedIOException("No se pudo crear la carpeta de imagenes de producto", ex);
        }

        return productsRoot;
    }

    private static String toDirectoryResourceLocation(Path path) {
        String location = path.toUri().toString();
        return location.endsWith("/") ? location : location + "/";
    }
}
