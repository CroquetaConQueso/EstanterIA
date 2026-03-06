package com.proyectofincurso.estanteria.web.error;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiErrorResponse handleValidation(MethodArgumentNotValidException ex,
                                             HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }

        return ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message("La petición contiene errores de validación")
                .path(request.getRequestURI())
                .fieldErrors(fieldErrors)
                .build();
    }

    @ExceptionHandler(ApiException.class)
    public ApiErrorResponse handleApiException(ApiException ex,
                                               HttpServletRequest request) {
        return ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(ex.getStatus().value())
                .error(ex.getCode())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .fieldErrors(null)
                .build();
    }

    @ExceptionHandler(Exception.class)
    public ApiErrorResponse handleGenericException(Exception ex,
                                                   HttpServletRequest request) {
        log.error("Error interno no controlado en {}", request.getRequestURI(), ex);

        return ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message("Ha ocurrido un error interno inesperado")
                .path(request.getRequestURI())
                .fieldErrors(null)
                .build();
    }
}