package com.proyectofincurso.estanteria.integration.vision;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

@Service
@ConditionalOnProperty(name = "vision.provider", havingValue = "http", matchIfMissing = true)
public class VisionResultadoHttpProvider implements VisionResultadoProvider {

    private final VisionClient visionClient;
    private final CapturePathNormalizer capturePathNormalizer;

    public VisionResultadoHttpProvider(VisionClient visionClient, CapturePathNormalizer capturePathNormalizer) {
        this.visionClient = visionClient;
        this.capturePathNormalizer = capturePathNormalizer;
    }

    @Override
    public ResultadoVisualResponse obtenerResultado(String estanteriaCodigo, String modo, String imagePath) {
        ResultadoVisualResponse resultado = switch (modo) {
            case "capture-and-predict" -> visionClient.captureAndPredict(estanteriaCodigo);
            case "predict-existing" -> visionClient.predictExisting(estanteriaCodigo, imagePath);
            default -> throw ApiException.badRequest(
                    "INVALID_VISION_MODE",
                    "El modo de visi\u00f3n indicado no es v\u00e1lido"
            );
        };

        if (resultado.getEstanteriaCodigo() == null || resultado.getEstanteriaCodigo().isBlank()) {
            resultado.setEstanteriaCodigo(estanteriaCodigo);
        }
        capturePathNormalizer.normalizar(resultado, estanteriaCodigo);
        validarContrato(resultado);

        return resultado;
    }

    private void validarContrato(ResultadoVisualResponse resultado) {
        if (resultado.getImagen() == null || resultado.getResumen() == null || resultado.getSlots() == null) {
            throw ApiException.badRequest(
                    "VISION_INVALID_RESPONSE",
                    "El servicio de visi\u00f3n no devolvi\u00f3 el contrato visual por slots completo"
            );
        }
    }
}
