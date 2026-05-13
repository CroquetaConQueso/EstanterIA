package com.proyectofincurso.estanteria.service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.entity.InspeccionSlotResultado;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.web.dto.ImagenVisualResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionDetalleResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionItemResponse;
import com.proyectofincurso.estanteria.web.dto.InspeccionarResponse;
import com.proyectofincurso.estanteria.web.dto.ResultadoVisualResponse;
import com.proyectofincurso.estanteria.web.dto.ResumenVisualResponse;
import com.proyectofincurso.estanteria.web.dto.SlotVisualResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InspeccionService {

    private static final int IMAGEN_PATH_CAPACIDAD = 255;
    private static final Pattern SAFE_RELATIVE_PATH = Pattern.compile("^[a-zA-Z0-9/_\\-.]+$");
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp");

    private final InspeccionRepository insRepo;

    @Transactional(readOnly = true)
    public List<InspeccionItemResponse> obtenerInspecciones() {
        return insRepo.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InspeccionDetalleResponse obtenerInspeccion(Long id) {
        Inspeccion ins = insRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "INSPECCION_NOT_FOUND",
                        "No existe la inspección solicitada"
                ));

        return toDetalleResponse(ins);
    }

    private InspeccionItemResponse toResponse(Inspeccion ins) {
        return new InspeccionItemResponse(
                ins.getId(),
                ins.getEstanteriaCodigo(),
                ins.getNotas(),
                ins.getImagenPath(),
                ins.getEstado(),
                ins.getCreatedAt(),
                ins.getEstadoGeneralVisual(),
                ins.getOcupados(),
                ins.getVacios(),
                ins.getAnomalias(),
                ins.getModeloVersion(),
                ins.getCapturadaEn()
        );
    }

    private InspeccionDetalleResponse toDetalleResponse(Inspeccion ins) {
        return new InspeccionDetalleResponse(
                ins.getId(),
                ins.getEstanteriaCodigo(),
                ins.getNotas(),
                ins.getImagenPath(),
                ins.getEstado(),
                ins.getCreatedAt(),
                toResultadoVisual(ins)
        );
    }

    private ResultadoVisualResponse toResultadoVisual(Inspeccion ins) {
        if (ins.getModeloVersion() == null) {
            return null;
        }

        List<SlotVisualResponse> slots = ins.getSlots().stream()
                .map(slot -> new SlotVisualResponse(
                        slot.getSlotId(),
                        slot.getOrden(),
                        slot.getEstadoVisual(),
                        slot.getConfianza()
                ))
                .toList();

        return new ResultadoVisualResponse(
                ins.getEstanteriaCodigo(),
                ins.getModeloVersion(),
                ins.getCapturadaEn(),
                new ImagenVisualResponse(ins.getImagenNombreArchivo(), ins.getImagenPath()),
                new ResumenVisualResponse(
                        ins.getEstadoGeneralVisual(),
                        ins.getSlotsTotales(),
                        ins.getOcupados(),
                        ins.getVacios(),
                        ins.getAnomalias(),
                        ins.getHayHuecosVacios(),
                        ins.getHayAnomalias()
                ),
                slots
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

        return verificarImagenPath(imagenPath);
    }

    @Transactional
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

    @Transactional
    public InspeccionDetalleResponse crearInspeccionVisual(ResultadoVisualResponse resultadoVisual, String notas) {
        if (resultadoVisual == null || resultadoVisual.getEstanteriaCodigo() == null
                || resultadoVisual.getEstanteriaCodigo().trim().isEmpty()) {
            throw ApiException.badRequest(
                    "INVALID_VISUAL_RESULT",
                    "El resultado visual no contiene código de estantería"
            );
        }

        Inspeccion ins = new Inspeccion();
        ins.setEstanteriaCodigo(resultadoVisual.getEstanteriaCodigo().trim());
        ins.setNotas(notas);
        ins.setEstado(EstanteriaEstado.CREADA);
        ins.setCreatedAt(resultadoVisual.getCapturadaEn() == null ? Instant.now() : resultadoVisual.getCapturadaEn());

        aplicarResultadoVisual(ins, resultadoVisual);

        insRepo.save(ins);

        return toDetalleResponse(ins);
    }

    private void aplicarResultadoVisual(Inspeccion ins, ResultadoVisualResponse resultadoVisual) {
        ImagenVisualResponse imagen = resultadoVisual.getImagen();
        if (imagen != null) {
            ins.setImagenNombreArchivo(imagen.getNombreArchivo());
            ins.setImagenPath(imagen.getRuta());
        }

        ResumenVisualResponse resumen = resultadoVisual.getResumen();
        if (resumen != null) {
            ins.setEstadoGeneralVisual(resumen.getEstadoGeneralVisual());
            ins.setSlotsTotales(resumen.getSlotsTotales());
            ins.setOcupados(resumen.getOcupados());
            ins.setVacios(resumen.getVacios());
            ins.setAnomalias(resumen.getAnomalias());
            ins.setHayHuecosVacios(resumen.getHayHuecosVacios());
            ins.setHayAnomalias(resumen.getHayAnomalias());
        }

        ins.setModeloVersion(resultadoVisual.getModeloVersion());
        ins.setCapturadaEn(resultadoVisual.getCapturadaEn());
        ins.getSlots().clear();

        if (resultadoVisual.getSlots() == null) {
            return;
        }

        for (SlotVisualResponse slotVisual : resultadoVisual.getSlots()) {
            InspeccionSlotResultado slot = new InspeccionSlotResultado();
            slot.setInspeccion(ins);
            slot.setSlotId(slotVisual.getSlotId());
            slot.setOrden(slotVisual.getOrden());
            slot.setEstadoVisual(slotVisual.getEstadoVisual());
            slot.setConfianza(slotVisual.getConfianza());
            ins.getSlots().add(slot);
        }
    }
}
