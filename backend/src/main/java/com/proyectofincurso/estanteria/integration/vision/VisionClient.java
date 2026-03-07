package com.proyectofincurso.estanteria.integration.vision;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.proyectofincurso.estanteria.integration.vision.dto.VisionCapturePredictRequest;
import com.proyectofincurso.estanteria.integration.vision.dto.VisionPredictRequest;
import com.proyectofincurso.estanteria.integration.vision.dto.VisionPredictResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

@Component
public class VisionClient {

    private final RestTemplate restTemplate;

    @Value("${vision.api.base-url}")
    private String visionApiBaseUrl;

    public VisionClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public VisionPredictResponse captureAndPredict(String estanteriaCodigo) {
        String url = visionApiBaseUrl + "/capture-and-predict";

        VisionCapturePredictRequest request = new VisionCapturePredictRequest(estanteriaCodigo);

        try {
            ResponseEntity<VisionPredictResponse> response = restTemplate.postForEntity(
                    url,
                    request,
                    VisionPredictResponse.class
            );

            VisionPredictResponse body = response.getBody();

            if (body == null) {
                throw ApiException.badRequest(
                        "VISION_EMPTY_RESPONSE",
                        "El servicio de visión devolvió una respuesta vacía"
                );
            }

            return body;
        } catch (Exception ex) {
            throw ApiException.badRequest(
                    "VISION_SERVICE_ERROR",
                    "No se pudo completar la captura y análisis con el servicio de visión"
            );
        }
    }

    public VisionPredictResponse predictExisting(String imagePath) {
        String url = visionApiBaseUrl + "/predict";

        VisionPredictRequest request = new VisionPredictRequest(imagePath);

        try {
            ResponseEntity<VisionPredictResponse> response = restTemplate.postForEntity(
                    url,
                    request,
                    VisionPredictResponse.class
            );

            VisionPredictResponse body = response.getBody();

            if (body == null) {
                throw ApiException.badRequest(
                        "VISION_EMPTY_RESPONSE",
                        "El servicio de visión devolvió una respuesta vacía"
                );
            }

            return body;
        } catch (Exception ex) {
            throw ApiException.badRequest(
                    "VISION_SERVICE_ERROR",
                    "No se pudo analizar la imagen con el servicio de visión"
            );
        }
    }
}