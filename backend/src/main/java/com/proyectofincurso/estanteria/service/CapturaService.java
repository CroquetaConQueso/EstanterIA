package com.proyectofincurso.estanteria.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.integration.vision.CapturePathNormalizer;
import com.proyectofincurso.estanteria.web.dto.CapturaResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

@Service
public class CapturaService {

    private static final int DEFAULT_LIMIT = 50;
    private static final Pattern SAFE_SEGMENT = Pattern.compile("^[a-zA-Z0-9_-]+$");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");

    private final Path capturesRoot = CapturePathNormalizer.resolveCapturesRoot();

    public List<CapturaResponse> listarCapturas(String estanteriaCodigo) {
        String codigoNormalizado = normalizarEstanteriaCodigo(estanteriaCodigo);

        if (!Files.exists(capturesRoot)) {
            return List.of();
        }

        Path base = codigoNormalizado == null ? capturesRoot : capturesRoot.resolve(codigoNormalizado).normalize();
        if (!base.startsWith(capturesRoot)) {
            throw ApiException.badRequest(
                    "INVALID_ESTANTERIA_CODIGO",
                    "El codigo de estanteria no es valido"
            );
        }

        if (!Files.exists(base) || !Files.isDirectory(base)) {
            return List.of();
        }

        int profundidad = codigoNormalizado == null ? 2 : 1;
        try (Stream<Path> paths = Files.walk(base, profundidad)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(this::esExtensionPermitida)
                    .map(this::toCandidate)
                    .filter(candidate -> candidate != null)
                    .sorted(Comparator.comparing(CapturaCandidate::lastModifiedAt).reversed())
                    .limit(DEFAULT_LIMIT)
                    .map(CapturaCandidate::response)
                    .toList();
        } catch (IOException ex) {
            throw ApiException.serviceUnavailable(
                    "CAPTURES_LIST_ERROR",
                    "No se pudieron listar las capturas disponibles"
            );
        }
    }

    private String normalizarEstanteriaCodigo(String estanteriaCodigo) {
        if (estanteriaCodigo == null || estanteriaCodigo.isBlank()) {
            return null;
        }

        String codigo = estanteriaCodigo.trim();
        if (codigo.contains("..") || codigo.contains("/") || codigo.contains("\\") || codigo.contains(":")
                || !SAFE_SEGMENT.matcher(codigo).matches()) {
            throw ApiException.badRequest(
                    "INVALID_ESTANTERIA_CODIGO",
                    "El codigo de estanteria no es valido"
            );
        }

        return codigo;
    }

    private boolean esExtensionPermitida(Path path) {
        String fileName = path.getFileName().toString();
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return false;
        }

        String extension = fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
        return ALLOWED_EXTENSIONS.contains(extension);
    }

    private CapturaCandidate toCandidate(Path path) {
        Path normalized = path.toAbsolutePath().normalize();
        if (!normalized.startsWith(capturesRoot)) {
            return null;
        }

        try {
            BasicFileAttributes attributes = Files.readAttributes(normalized, BasicFileAttributes.class);
            String relativePath = capturesRoot.relativize(normalized).toString().replace('\\', '/');
            CapturaResponse response = new CapturaResponse(
                    normalized.getFileName().toString(),
                    relativePath,
                    "/captures/" + relativePath,
                    attributes.size(),
                    attributes.creationTime().toInstant()
            );
            return new CapturaCandidate(response, attributes.lastModifiedTime().toInstant());
        } catch (IOException ex) {
            return null;
        }
    }

    private record CapturaCandidate(CapturaResponse response, Instant lastModifiedAt) {
    }
}
