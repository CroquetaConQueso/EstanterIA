package com.proyectofincurso.estanteria.service;

import java.time.Instant;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.integration.vision.VisionClient;
import com.proyectofincurso.estanteria.integration.vision.dto.VisionPredictResponse;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.web.dto.VisionInspeccionarRequest;
import com.proyectofincurso.estanteria.web.dto.VisionInspeccionarResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VisionService {

    private static final Set<String> MODOS_VALIDOS = Set.of("capture-and-predict", "predict-existing");

    private final VisionClient visionClient;
    private final InspeccionRepository inspeccionRepository;

    public VisionInspeccionarResponse inspeccionarConVision(String estanteriaCodigo, VisionInspeccionarRequest request) {
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

        String codigoNormalizado = estanteriaCodigo.trim();
        String modo = request.getModo().trim();

        if (!MODOS_VALIDOS.contains(modo)) {
            throw ApiException.badRequest(
                    "INVALID_VISION_MODE",
                    "El modo indicado no es válido"
            );
        }

        if ("predict-existing".equals(modo)) {
            if (request.getImagePath() == null || request.getImagePath().trim().isEmpty()) {
                throw ApiException.badRequest(
                        "INVALID_IMAGE_PATH",
                        "Debes indicar una ruta de imagen cuando usas imagen existente"
                );
            }
        }

        VisionPredictResponse visionResponse = ejecutarVision(modo, codigoNormalizado, request.getImagePath());

        Inspeccion inspeccion = new Inspeccion();
        inspeccion.setEstanteriaCodigo(codigoNormalizado);
        inspeccion.setNotas(request.getNotas());
        inspeccion.setImagenPath(visionResponse.getImagePath());
        inspeccion.setEstado(EstanteriaEstado.CREADA);
        inspeccion.setCreatedAt(Instant.now());

        inspeccionRepository.save(inspeccion);

        String imageUrl = buildImageUrl(visionResponse.getImageName());

        return new VisionInspeccionarResponse(
                "VISION_INSPECCION_OK",
                inspeccion.getId(),
                inspeccion.getEstanteriaCodigo(),
                inspeccion.getImagenPath(),
                imageUrl,
                visionResponse.getSummary(),
                inspeccion.getCreatedAt(),
                Boolean.TRUE.equals(visionResponse.getCritical())
        );
    }

    private VisionPredictResponse ejecutarVision(String modo, String estanteriaCodigo, String imagePath) {
        if ("capture-and-predict".equals(modo)) {
            return visionClient.captureAndPredict(estanteriaCodigo);
        }

        return visionClient.predictExisting(imagePath.trim());
    }

    private String buildImageUrl(String imageName) {
        if (imageName == null || imageName.trim().isEmpty()) {
            return null;
        }
        return "/captures/" + imageName.trim();
    }
}