package com.proyectofincurso.estanteria.web.dto;

import java.time.Instant;

public record CapturaResponse(
        String fileName,
        String relativePath,
        String imageUrl,
        Long sizeBytes,
        Instant createdAt
) {
}
