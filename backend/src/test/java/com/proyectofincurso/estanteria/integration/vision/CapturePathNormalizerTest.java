package com.proyectofincurso.estanteria.integration.vision;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import com.proyectofincurso.estanteria.web.dto.ImagenVisualResponse;
import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;

class CapturePathNormalizerTest {

    private static final Path RAW_DIR = CapturePathNormalizer.resolveCapturesRoot();
    private static final String SHELF_CODE = "EST-UNIT";
    private static final String SHELF_IMAGE = "capture_unit_shelf.png";
    private static final String LEGACY_IMAGE = "capture_unit_legacy.png";

    private final CapturePathNormalizer normalizer = new CapturePathNormalizer();

    @AfterEach
    void cleanUp() throws Exception {
        Files.deleteIfExists(RAW_DIR.resolve(SHELF_CODE).resolve(SHELF_IMAGE));
        Files.deleteIfExists(RAW_DIR.resolve(SHELF_CODE));
        Files.deleteIfExists(RAW_DIR.resolve(LEGACY_IMAGE));
    }

    @Test
    void includesShelfCodeWhenImageExistsInsideShelfFolder() throws Exception {
        Files.createDirectories(RAW_DIR.resolve(SHELF_CODE));
        Files.writeString(RAW_DIR.resolve(SHELF_CODE).resolve(SHELF_IMAGE), "test");
        ResultadoVisualResponse resultado = resultado("/captures/" + SHELF_IMAGE);

        normalizer.normalizar(resultado, SHELF_CODE);

        assertThat(resultado.getImagen().getRuta()).isEqualTo("/captures/EST-UNIT/capture_unit_shelf.png");
        assertThat(resultado.getImagen().getNombreArchivo()).isEqualTo(SHELF_IMAGE);
    }

    @Test
    void keepsLegacyRootCaptureWhenImageExistsAtRawRoot() throws Exception {
        Files.createDirectories(RAW_DIR);
        Files.writeString(RAW_DIR.resolve(LEGACY_IMAGE), "test");
        ResultadoVisualResponse resultado = resultado("/captures/" + LEGACY_IMAGE);

        normalizer.normalizar(resultado, SHELF_CODE);

        assertThat(resultado.getImagen().getRuta()).isEqualTo("/captures/capture_unit_legacy.png");
        assertThat(resultado.getImagen().getNombreArchivo()).isEqualTo(LEGACY_IMAGE);
    }

    private ResultadoVisualResponse resultado(String ruta) {
        ResultadoVisualResponse resultado = new ResultadoVisualResponse();
        resultado.setImagen(new ImagenVisualResponse(null, ruta));
        resultado.setEstanteriaCodigo(SHELF_CODE);
        return resultado;
    }
}
