package com.proyectofincurso.estanteria.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import com.proyectofincurso.estanteria.integration.vision.CapturePathNormalizer;
import com.proyectofincurso.estanteria.web.error.ApiException;

class CapturaServiceTest {

    private static final Path RAW_DIR = CapturePathNormalizer.resolveCapturesRoot();
    private static final String SHELF_CODE = "EST-CAPTURA-UNIT";
    private static final String IMAGE_NAME = "capture_unit.PNG";
    private static final String IGNORED_NAME = "manifest.csv";

    private final CapturaService capturaService = new CapturaService();

    @AfterEach
    void cleanUp() throws Exception {
        Files.deleteIfExists(RAW_DIR.resolve(SHELF_CODE).resolve(IMAGE_NAME));
        Files.deleteIfExists(RAW_DIR.resolve(SHELF_CODE).resolve(IGNORED_NAME));
        Files.deleteIfExists(RAW_DIR.resolve(SHELF_CODE));
    }

    @Test
    void listsSafeShelfCapturesWithoutPhysicalPaths() throws Exception {
        Files.createDirectories(RAW_DIR.resolve(SHELF_CODE));
        Files.writeString(RAW_DIR.resolve(SHELF_CODE).resolve(IMAGE_NAME), "image");
        Files.writeString(RAW_DIR.resolve(SHELF_CODE).resolve(IGNORED_NAME), "ignored");

        var capturas = capturaService.listarCapturas(SHELF_CODE);

        assertThat(capturas).hasSize(1);
        assertThat(capturas.get(0).fileName()).isEqualTo(IMAGE_NAME);
        assertThat(capturas.get(0).relativePath()).isEqualTo("EST-CAPTURA-UNIT/capture_unit.PNG");
        assertThat(capturas.get(0).imageUrl()).isEqualTo("/captures/EST-CAPTURA-UNIT/capture_unit.PNG");
        assertThat(capturas.get(0).imageUrl()).doesNotContain("\\");
        assertThat(capturas.get(0).imageUrl()).doesNotContain(":");
        assertThat(capturas.get(0).sizeBytes()).isPositive();
        assertThat(capturas.get(0).createdAt()).isNotNull();
    }

    @Test
    void rejectsUnsafeShelfCode() {
        assertThatThrownBy(() -> capturaService.listarCapturas("../EST-001"))
                .isInstanceOf(ApiException.class)
                .hasMessage("El codigo de estanteria no es valido");
    }
}
