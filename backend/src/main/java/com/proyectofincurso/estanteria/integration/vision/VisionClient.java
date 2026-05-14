package com.proyectofincurso.estanteria.integration.vision;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.proyectofincurso.estanteria.integration.vision.dto.VisionCapturePredictRequest;
import com.proyectofincurso.estanteria.integration.vision.dto.VisionPredictRequest;
import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

@Component
public class VisionClient {

    private final RestTemplate restTemplate;

    @Value("${vision.api.base-url}")
    private String visionApiBaseUrl;

    public VisionClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public ResultadoVisualResponse captureAndPredict(String estanteriaCodigo) {
        String url = visionApiBaseUrl + "/capture-and-predict";

        VisionCapturePredictRequest request = new VisionCapturePredictRequest(estanteriaCodigo);

        try {
            ResponseEntity<ResultadoVisualResponse> response = restTemplate.postForEntity(
                    url,
                    request,
                    ResultadoVisualResponse.class
            );

            ResultadoVisualResponse body = response.getBody();

            if (body == null) {
                throw ApiException.badRequest(
                        "VISION_EMPTY_RESPONSE",
                        "El servicio de vision devolvio una respuesta vacia"
                );
            }

            return body;
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw ApiException.serviceUnavailable(
                    "VISION_SERVICE_ERROR",
                    "No se pudo completar la captura y analisis con el servicio de vision"
            );
        }
    }

    public ResultadoVisualResponse predictExisting(String estanteriaCodigo, String imagePath) {
        String url = visionApiBaseUrl + "/predict";

        VisionPredictRequest request = new VisionPredictRequest(imagePath, estanteriaCodigo);

        try {
            ResponseEntity<ResultadoVisualResponse> response = restTemplate.postForEntity(
                    url,
                    request,
                    ResultadoVisualResponse.class
            );

            ResultadoVisualResponse body = response.getBody();

            if (body == null) {
                throw ApiException.badRequest(
                        "VISION_EMPTY_RESPONSE",
                        "El servicio de vision devolvio una respuesta vacia"
                );
            }

            return body;
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw ApiException.serviceUnavailable(
                    "VISION_SERVICE_ERROR",
                    "No se pudo analizar la imagen con el servicio de vision"
            );
        }
    }
}
