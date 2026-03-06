package com.proyectofincurso.estanteria.service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
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


    public List<InspeccionItemResponse> obtenerInspecciones(){
        return insRepo.findAll().stream().map(this::toResponse).toList();
    }

    private InspeccionItemResponse toResponse(Inspeccion ins) {
        return new InspeccionItemResponse(
                ins.getId(),
                ins.getEstanteriaCodigo(),
                ins.getNotas(),
                ins.getImagenPath(),
                ins.getEstado(),
                ins.getCreatedAt()
        );
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

        if (insRepo.existsByEstanteriaCodigoIgnoreCase(estanteriaCodigo)) {
            throw ApiException.conflict(
                    "ESTANTERIA_CODIGO_ALREADY_EXISTS",
                    "Ya existe una estantería con ese código"
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
}