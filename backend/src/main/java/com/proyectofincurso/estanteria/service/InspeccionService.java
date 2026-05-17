package com.proyectofincurso.estanteria.service;

import java.time.Instant;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyectofincurso.estanteria.integration.vision.CapturePathNormalizer;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.entity.InspeccionSlotResultado;
import com.proyectofincurso.estanteria.persistence.repository.AlertaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
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
    private static final String CAPTURES_PREFIX = "/captures/";
    private static final String CAPTURES_RELATIVE_PREFIX = "captures/";
    private static final String MOTIVO_INSPECCION_CON_ALERTAS = "La inspeccion genero alertas operativas.";
    private static final String MENSAJE_CONFLICTO_ELIMINACION = "No se puede eliminar esta inspeccion porque genero alertas operativas.";
    private static final Pattern SAFE_RELATIVE_PATH = Pattern.compile("^[a-zA-Z0-9/_\\-.]+$");
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp");

    private final InspeccionRepository insRepo;
    private final EstanteriaRepository estanteriaRepository;
    private final AlertaRepository alertaRepository;
    private final TareaOperativaRepository tareaOperativaRepository;
    private final Path capturesRoot = CapturePathNormalizer.resolveCapturesRoot();

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
        boolean eliminable = esEliminable(ins.getId());
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
                ins.getCapturadaEn(),
                eliminable,
                eliminable ? null : MOTIVO_INSPECCION_CON_ALERTAS
        );
    }

    private InspeccionDetalleResponse toDetalleResponse(Inspeccion ins) {
        boolean eliminable = esEliminable(ins.getId());
        return new InspeccionDetalleResponse(
                ins.getId(),
                ins.getEstanteriaCodigo(),
                ins.getNotas(),
                ins.getImagenPath(),
                ins.getEstado(),
                ins.getCreatedAt(),
                toResultadoVisual(ins),
                eliminable,
                eliminable ? null : MOTIVO_INSPECCION_CON_ALERTAS
        );
    }

    private boolean esEliminable(Long inspeccionId) {
        return !alertaRepository.existsByInspeccionIdOrSlotResultadoInspeccionId(inspeccionId)
                && !tareaOperativaRepository.existsByAlertaDeInspeccionId(inspeccionId);
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

        String capturaPublica = verificarCapturaPublica(imagenPath);
        if (capturaPublica != null) {
            return capturaPublica;
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

    private String verificarCapturaPublica(String imagenPath) {
        String normalizado = imagenPath.trim().replace("\\", "/");
        while (normalizado.startsWith("./")) {
            normalizado = normalizado.substring(2);
        }

        if (normalizado.startsWith(CAPTURES_RELATIVE_PREFIX)) {
            normalizado = CAPTURES_PREFIX + normalizado.substring(CAPTURES_RELATIVE_PREFIX.length());
        }
        if (!normalizado.startsWith(CAPTURES_PREFIX)) {
            return null;
        }

        String relativa = normalizado.substring(CAPTURES_PREFIX.length());
        if (relativa.isBlank() || relativa.contains("..") || relativa.startsWith("/") || relativa.contains(":")
                || !SAFE_RELATIVE_PATH.matcher(relativa).matches()) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "La ruta de captura no es valida"
            );
        }

        int dot = relativa.lastIndexOf('.');
        if (dot <= 0 || dot == relativa.length() - 1) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "imagenPath invalido: falta extension"
            );
        }

        String ext = relativa.substring(dot + 1).toLowerCase();
        if (!ALLOWED_EXT.contains(ext)) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "imagenPath invalido: extension no permitida"
            );
        }

        Path capturaPath = capturesRoot.resolve(relativa).normalize();
        if (!capturaPath.startsWith(capturesRoot) || !Files.isRegularFile(capturaPath)) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "La imagen seleccionada no existe"
            );
        }

        String rutaPublica = CAPTURES_PREFIX + relativa;
        if (rutaPublica.length() > IMAGEN_PATH_CAPACIDAD) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "El path de la imagen es demasiado largo, solo se permiten 255 caracteres"
            );
        }

        return rutaPublica;
    }

    public String verificarCapturaInspeccionPath(String imagenPath) {
        if (imagenPath == null || imagenPath.trim().isEmpty()) {
            return null;
        }

        String capturaPublica = verificarCapturaPublica(imagenPath);
        if (capturaPublica == null) {
            throw ApiException.badRequest(
                    "INVALID_IMAGE_PATH",
                    "Solo se pueden asociar capturas servidas desde /captures/"
            );
        }

        return capturaPublica;
    }

    private String extraerNombreArchivo(String imagenPath) {
        if (imagenPath == null || imagenPath.isBlank()) {
            return null;
        }

        String normalizado = imagenPath.replace("\\", "/");
        int lastSlash = normalizado.lastIndexOf('/');
        return lastSlash >= 0 ? normalizado.substring(lastSlash + 1) : normalizado;
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
        estanteriaRepository.findByCodigoAndActivaTrue(codigoNormalizado).ifPresent(ins::setEstanteria);
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
    public InspeccionDetalleResponse actualizarImagen(Long id, String imagenPath) {
        Inspeccion ins = insRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(
                        "INSPECCION_NOT_FOUND",
                        "No existe la inspeccion solicitada"
                ));

        String imagenPathValidado = verificarCapturaInspeccionPath(imagenPath);
        ins.setImagenPath(imagenPathValidado);
        ins.setImagenNombreArchivo(extraerNombreArchivo(imagenPathValidado));

        return toDetalleResponse(ins);
    }

    @Transactional
    public void eliminarInspeccion(Long id) {
        Inspeccion ins = insRepo.findByIdConSlotsYEstanteria(id)
                .orElseThrow(() -> ApiException.notFound(
                        "INSPECCION_NOT_FOUND",
                        "No existe la inspeccion solicitada"
                ));

        if (!esEliminable(id)) {
            throw ApiException.conflict(
                    "INSPECCION_CON_ALERTAS",
                    MENSAJE_CONFLICTO_ELIMINACION
            );
        }

        insRepo.delete(ins);
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
        estanteriaRepository.findByCodigoAndActivaTrue(ins.getEstanteriaCodigo()).ifPresent(ins::setEstanteria);
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
