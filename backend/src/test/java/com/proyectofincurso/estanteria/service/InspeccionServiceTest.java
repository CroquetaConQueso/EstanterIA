package com.proyectofincurso.estanteria.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.proyectofincurso.estanteria.integration.vision.CapturePathNormalizer;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.repository.AlertaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;

class InspeccionServiceTest {

    private static final Path RAW_DIR = CapturePathNormalizer.resolveCapturesRoot();
    private static final String SHELF_CODE = "EST-IMG-UNIT";
    private static final String IMAGE_NAME = "capture_detail.png";

    private InspeccionRepository inspeccionRepository;
    private AlertaRepository alertaRepository;
    private TareaOperativaRepository tareaOperativaRepository;
    private InspeccionService inspeccionService;

    @BeforeEach
    void setUp() {
        inspeccionRepository = mock(InspeccionRepository.class);
        alertaRepository = mock(AlertaRepository.class);
        tareaOperativaRepository = mock(TareaOperativaRepository.class);
        inspeccionService = new InspeccionService(
                inspeccionRepository,
                mock(EstanteriaRepository.class),
                alertaRepository,
                tareaOperativaRepository
        );
    }

    @AfterEach
    void cleanUp() throws Exception {
        Files.deleteIfExists(RAW_DIR.resolve(SHELF_CODE).resolve(IMAGE_NAME));
        Files.deleteIfExists(RAW_DIR.resolve(SHELF_CODE));
    }

    @Test
    void updatesInspectionImageWithExistingCapture() throws Exception {
        Files.createDirectories(RAW_DIR.resolve(SHELF_CODE));
        Files.writeString(RAW_DIR.resolve(SHELF_CODE).resolve(IMAGE_NAME), "image");
        Inspeccion inspeccion = crearInspeccion();
        mockInspeccion(inspeccion);

        var response = inspeccionService.actualizarImagen(1L, "captures/EST-IMG-UNIT/capture_detail.png");

        assertThat(response.getImagenPath()).isEqualTo("/captures/EST-IMG-UNIT/capture_detail.png");
        assertThat(inspeccion.getImagenPath()).isEqualTo("/captures/EST-IMG-UNIT/capture_detail.png");
        assertThat(inspeccion.getImagenNombreArchivo()).isEqualTo(IMAGE_NAME);
    }

    @Test
    void clearsInspectionImageWhenPathIsBlank() {
        Inspeccion inspeccion = crearInspeccion();
        inspeccion.setImagenPath("/captures/EST-IMG-UNIT/capture_detail.png");
        inspeccion.setImagenNombreArchivo(IMAGE_NAME);
        mockInspeccion(inspeccion);

        var response = inspeccionService.actualizarImagen(1L, " ");

        assertThat(response.getImagenPath()).isNull();
        assertThat(inspeccion.getImagenPath()).isNull();
        assertThat(inspeccion.getImagenNombreArchivo()).isNull();
    }

    @Test
    void rejectsNonCapturePathsWhenUpdatingInspectionImage() {
        Inspeccion inspeccion = crearInspeccion();
        mockInspeccion(inspeccion);

        assertThatThrownBy(() -> inspeccionService.actualizarImagen(1L, "manual/image.png"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Solo se pueden asociar capturas servidas desde /captures/");
    }

    private void mockInspeccion(Inspeccion inspeccion) {
        when(inspeccionRepository.findById(1L)).thenReturn(Optional.of(inspeccion));
        when(alertaRepository.existsByInspeccionIdOrSlotResultadoInspeccionId(1L)).thenReturn(false);
        when(tareaOperativaRepository.existsByAlertaDeInspeccionId(1L)).thenReturn(false);
    }

    private Inspeccion crearInspeccion() {
        Inspeccion inspeccion = new Inspeccion();
        inspeccion.setId(1L);
        inspeccion.setEstanteriaCodigo(SHELF_CODE);
        inspeccion.setNotas("Manual");
        inspeccion.setEstado(EstanteriaEstado.CREADA);
        inspeccion.setCreatedAt(Instant.parse("2026-05-16T10:00:00Z"));
        return inspeccion;
    }
}
