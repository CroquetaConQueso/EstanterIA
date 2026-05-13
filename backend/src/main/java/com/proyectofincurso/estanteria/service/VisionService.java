package com.proyectofincurso.estanteria.service;

import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.integration.vision.VisionResultadoProvider;
import com.proyectofincurso.estanteria.web.dto.InspeccionDetalleResponse;
import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;
import com.proyectofincurso.estanteria.web.dto.VisionInspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.VisionInspeccionarResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VisionService {

    private static final Set<String> MODOS_VALIDOS = Set.of("capture-and-predict", "predict-existing");

    private final VisionResultadoProvider visionResultadoProvider;
    private final InspeccionService inspeccionService;
    private final AlertaOperativaService alertaOperativaService;

    public VisionInspeccionarResponse inspeccionarConVision(String estanteriaCodigo, VisionInspeccionarRequest request) {
        validarPeticion(estanteriaCodigo, request);

        String codigoNormalizado = estanteriaCodigo.trim();
        String modo = request.getModo().trim();
        ResultadoVisualResponse resultadoVisual = visionResultadoProvider.obtenerResultado(
                codigoNormalizado,
                modo,
                request.getImagePath()
        );

        InspeccionDetalleResponse inspeccion = inspeccionService.crearInspeccionVisual(
                resultadoVisual,
                request.getNotas()
        );
        alertaOperativaService.evaluarInspeccionVisual(inspeccion.getId());

        return new VisionInspeccionarResponse(
                "VISION_INSPECCION_OK",
                inspeccion.getId(),
                resultadoVisual.getEstanteriaCodigo(),
                resultadoVisual.getImagen().getRuta(),
                resultadoVisual.getImagen().getRuta(),
                Map.of(
                        "ocupados", resultadoVisual.getResumen().getOcupados(),
                        "vacios", resultadoVisual.getResumen().getVacios(),
                        "anomalias", resultadoVisual.getResumen().getAnomalias()
                ),
                inspeccion.getCreatedAt(),
                Boolean.TRUE.equals(resultadoVisual.getResumen().getHayAnomalias()),
                resultadoVisual
        );
    }

    private void validarPeticion(String estanteriaCodigo, VisionInspeccionarRequest request) {
        if (estanteriaCodigo == null || estanteriaCodigo.trim().isEmpty()) {
            throw ApiException.badRequest(
                    "INVALID_ESTANTERIA_CODIGO",
                    "El código de estantería es obligatorio"
            );
        }

        if (request == null || request.getModo() == null || request.getModo().trim().isEmpty()) {
            throw ApiException.badRequest(
                    "INVALID_VISION_MODE",
                    "El modo de visión es obligatorio"
            );
        }

        String modo = request.getModo().trim();
        if (!MODOS_VALIDOS.contains(modo)) {
            throw ApiException.badRequest(
                    "INVALID_VISION_MODE",
                    "El modo indicado no es válido"
            );
        }

        if ("predict-existing".equals(modo)
                && (request.getImagePath() == null || request.getImagePath().trim().isEmpty())) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "Debes indicar una ruta de imagen cuando usas imagen existente"
            );
        }
    }
}
