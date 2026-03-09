package com.proyectofincurso.estanteria.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.web.dto.InspeccionDetailResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionUpdateRequest;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InspeccionService {

    private static final int IMAGEN_PATH_CAPACIDAD = 255;
    private static final Pattern SAFE_RELATIVE_PATH = Pattern.compile("^[a-zA-Z0-9/_\\-.]+$");
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp");

    private final InspeccionRepository insRepo;

    public List<InspeccionItemResponse> obtenerInspecciones() {
        return insRepo.findAll()
                .stream()
                .sorted(Comparator.comparing(Inspeccion::getCreatedAt).reversed())
                .map(this::toItemResponse)
                .toList();
    }

    public InspeccionDetailResponse obtenerInspeccionDetalle(Long id) {
        Inspeccion ins = obtenerInspeccionPorId(id);

        return new InspeccionDetailResponse(
                ins.getId(),
                ins.getEstanteriaCodigo(),
                ins.getNotas(),
                ins.getImagenPath(),
                buildImageUrl(ins.getImagenPath()),
                ins.getEstado(),
                ins.getCreatedAt(),
                buildSummaryPlaceholder(),
                List.of("Pendiente de conectar detalle real de productos OK"),
                List.of("Pendiente de conectar detalle real de huecos")
        );
    }

    public InspeccionDetailResponse actualizarInspeccion(Long id, InspeccionUpdateRequest req) {
        Inspeccion ins = obtenerInspeccionPorId(id);

        if (req == null) {
            throw ApiException.badRequest(
                    "INVALID_INSPECCION_UPDATE",
                    "La petición de actualización es obligatoria"
            );
        }

        if (req.getNotas() != null) {
            String notasNormalizadas = req.getNotas().trim();
            ins.setNotas(notasNormalizadas.isEmpty() ? null : notasNormalizadas);
        }

        if (req.getEstado() != null) {
            ins.setEstado(req.getEstado());
        }

        insRepo.save(ins);

        return obtenerInspeccionDetalle(ins.getId());
    }

    public void eliminarInspeccion(Long id) {
        Inspeccion ins = obtenerInspeccionPorId(id);
        insRepo.delete(ins);
    }

    public String verificarImagenPath(String imagenPath) {
        if (imagenPath == null) {
            return null;
        }

        imagenPath = imagenPath.trim();

        if (imagenPath.isEmpty()) {
            return null;
        }

        if (imagenPath.length() > IMAGEN_PATH_CAPACIDAD) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "El path de la imagen es demasiado largo, solo se permiten 255 caracteres"
            );
        }

        if (imagenPath.contains("..")) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "No está permitido usar '..' dentro del path"
            );
        }

        if (imagenPath.startsWith("/") || imagenPath.startsWith("\\") || imagenPath.contains(":")) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "No se permiten rutas absolutas"
            );
        }

        if (imagenPath.startsWith("http://") || imagenPath.startsWith("https://")) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "imagenPath inválido: no se permiten URLs"
            );
        }

        if (!SAFE_RELATIVE_PATH.matcher(imagenPath).matches()) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "imagenPath inválido: contiene caracteres no permitidos"
            );
        }

        int dot = imagenPath.lastIndexOf('.');
        if (dot <= 0 || dot == imagenPath.length() - 1) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "imagenPath inválido: falta extensión"
            );
        }

        String ext = imagenPath.substring(dot + 1).toLowerCase();
        if (!ALLOWED_EXT.contains(ext)) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "imagenPath inválido: extensión no permitida"
            );
        }

        return imagenPath;
    }

    public String verificarDatos(String estanteriaCodigo, String imagenPath) {
        if (estanteriaCodigo == null || estanteriaCodigo.trim().isEmpty()) {
            throw ApiException.badRequest(
                    "INVALID_ESTANTERIA_CODIGO",
                    "El código de estantería es obligatorio"
            );
        }

        return verificarImagenPath(imagenPath);
    }

    public InspeccionarResponse crearInspeccion(String estanteriaCodigo, String notas, String imagenPath) {
        String codigoNormalizado = estanteriaCodigo == null ? null : estanteriaCodigo.trim();
        String imagenPathValidado = verificarDatos(codigoNormalizado, imagenPath);

        Inspeccion ins = new Inspeccion();
        ins.setEstanteriaCodigo(codigoNormalizado);
        ins.setNotas(notas);
        ins.setImagenPath(imagenPathValidado);
        ins.setEstado(EstanteriaEstado.CREADA);
        ins.setCreatedAt(Instant.now());

        insRepo.save(ins);

        return new InspeccionarResponse(
                "INSPECCION_OK",
                ins.getId(),
                ins.getEstanteriaCodigo(),
                ins.getNotas(),
                ins.getImagenPath(),
                ins.getEstado(),
                ins.getCreatedAt()
        );
    }

    private Inspeccion obtenerInspeccionPorId(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest(
                    "INVALID_INSPECCION_ID",
                    "El id de la inspección no es válido"
            );
        }

        return insRepo.findById(id)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "INSPECCION_NOT_FOUND",
                        "No existe ninguna inspección con el id indicado"
                ));
    }

    private InspeccionItemResponse toItemResponse(Inspeccion ins) {
        return new InspeccionItemResponse(
                ins.getId(),
                ins.getEstanteriaCodigo(),
                ins.getNotas(),
                ins.getImagenPath(),
                ins.getEstado(),
                ins.getCreatedAt()
        );
    }

    private String buildImageUrl(String imageName) {
        if (imageName == null || imageName.trim().isEmpty()) {
            return null;
        }

        return "/captures/" + imageName.trim();
    }

    private Map<String, Integer> buildSummaryPlaceholder() {
        Map<String, Integer> summary = new LinkedHashMap<>();
        summary.put("lentejas", 0);
        summary.put("arroz", 0);
        summary.put("comida_gato", 0);
        return summary;
    }
}