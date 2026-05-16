package com.proyectofincurso.estanteria.integration.vision;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import com.proyectofincurso.estanteria.web.dto.ImagenVisualResponse;
import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;

@Component
public class CapturePathNormalizer {

    private static final String CAPTURES_PREFIX = "/captures/";
    private static final String CAPTURES_RELATIVE_PREFIX = "captures/";

    private final Path capturesRoot = resolveCapturesRoot();

    public static Path resolveCapturesRoot() {
        Path currentDir = Paths.get("").toAbsolutePath().normalize();
        Path fromCurrentDir = currentDir.resolve(Paths.get("vision", "data", "raw")).normalize();
        if (Files.exists(fromCurrentDir)) {
            return fromCurrentDir;
        }

        Path parentDir = currentDir.getParent();
        if (parentDir != null) {
            Path fromParentDir = parentDir.resolve(Paths.get("vision", "data", "raw")).normalize();
            if (Files.exists(fromParentDir)) {
                return fromParentDir;
            }
        }

        return fromCurrentDir;
    }

    public ResultadoVisualResponse normalizar(ResultadoVisualResponse resultado, String estanteriaCodigoFallback) {
        if (resultado == null || resultado.getImagen() == null) {
            return resultado;
        }

        ImagenVisualResponse imagen = resultado.getImagen();
        String estanteriaCodigo = normalizarSegmento(
                resultado.getEstanteriaCodigo() == null || resultado.getEstanteriaCodigo().isBlank()
                        ? estanteriaCodigoFallback
                        : resultado.getEstanteriaCodigo()
        );
        String relativo = extraerRutaRelativa(imagen);

        if (relativo == null || relativo.isBlank()) {
            return resultado;
        }

        String rutaFinal = resolverRutaPublica(relativo, estanteriaCodigo);
        imagen.setRuta(CAPTURES_PREFIX + rutaFinal);
        imagen.setNombreArchivo(extraerNombreArchivo(rutaFinal));

        return resultado;
    }

    private String resolverRutaPublica(String relativo, String estanteriaCodigo) {
        String limpio = limpiarSeparadores(relativo);

        if (estanteriaCodigo == null || estanteriaCodigo.isBlank()) {
            return limpio;
        }

        if (limpio.equals(estanteriaCodigo) || limpio.startsWith(estanteriaCodigo + "/")) {
            return limpio;
        }

        Path rutaConEstanteria = capturesRoot.resolve(estanteriaCodigo).resolve(limpio).normalize();
        if (rutaConEstanteria.startsWith(capturesRoot) && Files.exists(rutaConEstanteria)) {
            return estanteriaCodigo + "/" + limpio;
        }

        Path rutaActual = capturesRoot.resolve(limpio).normalize();
        if (rutaActual.startsWith(capturesRoot) && Files.exists(rutaActual)) {
            return limpio;
        }

        if (!limpio.contains("/")) {
            return estanteriaCodigo + "/" + limpio;
        }

        return limpio;
    }

    private String extraerRutaRelativa(ImagenVisualResponse imagen) {
        String ruta = imagen.getRuta();
        if (ruta == null || ruta.isBlank()) {
            ruta = imagen.getNombreArchivo();
        }

        if (ruta == null) {
            return null;
        }

        String desdeRutaFisica = extraerDesdeRutaFisica(ruta.trim());
        if (desdeRutaFisica != null) {
            return desdeRutaFisica;
        }

        String normalizada = limpiarSeparadores(ruta.trim());
        while (normalizada.startsWith(CAPTURES_PREFIX.substring(1))) {
            normalizada = normalizada.substring(CAPTURES_RELATIVE_PREFIX.length());
        }
        while (normalizada.startsWith(CAPTURES_PREFIX)) {
            normalizada = normalizada.substring(CAPTURES_PREFIX.length());
        }

        return limpiarSeparadores(normalizada);
    }

    private String extraerDesdeRutaFisica(String ruta) {
        try {
            Path rutaNormalizada = Paths.get(ruta).toAbsolutePath().normalize();
            if (rutaNormalizada.startsWith(capturesRoot)) {
                return limpiarSeparadores(capturesRoot.relativize(rutaNormalizada).toString());
            }
        } catch (Exception ex) {
            return null;
        }
        return null;
    }

    private String limpiarSeparadores(String valor) {
        String normalizado = valor.replace('\\', '/');
        while (normalizado.startsWith("/")) {
            normalizado = normalizado.substring(1);
        }
        while (normalizado.contains("//")) {
            normalizado = normalizado.replace("//", "/");
        }
        return normalizado;
    }

    private String normalizarSegmento(String valor) {
        if (valor == null) {
            return null;
        }

        String limpio = valor.trim();
        if (limpio.isEmpty() || limpio.contains("/") || limpio.contains("\\") || limpio.contains("..")) {
            return null;
        }

        return limpio;
    }

    private String extraerNombreArchivo(String relativo) {
        int ultimoSeparador = relativo.lastIndexOf('/');
        if (ultimoSeparador >= 0 && ultimoSeparador < relativo.length() - 1) {
            return relativo.substring(ultimoSeparador + 1);
        }
        return relativo;
    }
}
