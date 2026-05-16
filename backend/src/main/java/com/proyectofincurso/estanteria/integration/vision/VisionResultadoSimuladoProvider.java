package com.proyectofincurso.estanteria.integration.vision;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.persistence.entity.EstadoGeneralVisual;
import com.proyectofincurso.estanteria.persistence.entity.EstadoVisualSlot;
import com.proyectofincurso.estanteria.web.dto.ImagenVisualResponse;
import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;
import com.proyectofincurso.estanteria.web.dto.ResumenVisualResponse;
import com.proyectofincurso.estanteria.web.dto.SlotVisualResponse;

@Service
@ConditionalOnProperty(name = "vision.provider", havingValue = "simulado")
public class VisionResultadoSimuladoProvider implements VisionResultadoProvider {

    private static final String MODELO_VERSION = "slot-classifier-v1";
    private static final DateTimeFormatter CAPTURE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").withZone(ZoneOffset.UTC);

    private final CapturePathNormalizer capturePathNormalizer;

    public VisionResultadoSimuladoProvider(CapturePathNormalizer capturePathNormalizer) {
        this.capturePathNormalizer = capturePathNormalizer;
    }

    @Override
    public ResultadoVisualResponse obtenerResultado(String estanteriaCodigo, String modo, String imagePath) {
        Instant capturadaEn = Instant.now();
        String nombreArchivo = resolverNombreArchivo(imagePath, capturadaEn);
        String ruta = "/captures/" + estanteriaCodigo + "/" + nombreArchivo;

        List<SlotVisualResponse> slots = List.of(
                new SlotVisualResponse("slot_1", 1, EstadoVisualSlot.OCUPADO, 0.97),
                new SlotVisualResponse("slot_2", 2, EstadoVisualSlot.VACIO, 0.94),
                new SlotVisualResponse("slot_3", 3, EstadoVisualSlot.ANOMALIA, 0.88),
                new SlotVisualResponse("slot_4", 4, EstadoVisualSlot.OCUPADO, 0.96)
        );

        ResumenVisualResponse resumen = new ResumenVisualResponse(
                EstadoGeneralVisual.MIXTO,
                slots.size(),
                2,
                1,
                1,
                true,
                true
        );

        ResultadoVisualResponse resultado = new ResultadoVisualResponse(
                estanteriaCodigo,
                MODELO_VERSION,
                capturadaEn,
                new ImagenVisualResponse(nombreArchivo, ruta),
                resumen,
                slots
        );
        return capturePathNormalizer.normalizar(resultado, estanteriaCodigo);
    }

    private String resolverNombreArchivo(String imagePath, Instant capturadaEn) {
        if (imagePath == null || imagePath.trim().isEmpty()) {
            return "capture_" + CAPTURE_FORMAT.format(capturadaEn) + ".jpg";
        }

        String normalizado = imagePath.trim().replace("\\", "/");
        int ultimoSeparador = normalizado.lastIndexOf('/');
        if (ultimoSeparador >= 0 && ultimoSeparador < normalizado.length() - 1) {
            return normalizado.substring(ultimoSeparador + 1);
        }

        return normalizado;
    }
}
