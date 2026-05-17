package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.AlertaTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoVisualSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.entity.InspeccionSlotResultado;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import com.proyectofincurso.estanteria.persistence.entity.Proveedor;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.SeccionEncargado;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.TrabajadorEstanteria;
import com.proyectofincurso.estanteria.persistence.repository.AlertaRepository;
import com.proyectofincurso.estanteria.persistence.repository.AlertaTrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorEstanteriaRepository;
import com.proyectofincurso.estanteria.web.dto.AlertaAsignacionResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaSlotResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaTrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.EvaluacionCaducidadResponse;
import com.proyectofincurso.estanteria.web.dto.EvaluacionInspeccionAlertasResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProveedorResumenResponse;
import com.proyectofincurso.estanteria.web.dto.RevisionCaducidadesResponse;
import com.proyectofincurso.estanteria.web.dto.RevisionTrabajadoresNoDisponiblesResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertaOperativaService {

    private static final List<EstadoTareaOperativa> ESTADOS_TAREAS_ACTIVAS = List.of(
            EstadoTareaOperativa.PENDIENTE,
            EstadoTareaOperativa.EN_PROGRESO
    );

    private final InspeccionRepository inspeccionRepository;
    private final EstanteriaRepository estanteriaRepository;
    private final EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    private final AsignacionProductoSlotRepository asignacionProductoSlotRepository;
    private final SeccionEncargadoRepository seccionEncargadoRepository;
    private final TrabajadorEstanteriaRepository trabajadorEstanteriaRepository;
    private final TareaOperativaRepository tareaOperativaRepository;
    private final AlertaRepository alertaRepository;
    private final AlertaTrabajadorRepository alertaTrabajadorRepository;
    private final TareaOperativaService tareaOperativaService;

    @Value("${alertas.revision-manual.umbral-confianza:0.70}")
    private double umbralConfianzaRevisionManual;

    @Value("${app.alertas.caducidad.dias-anticipacion:${alertas.caducidad.dias-umbral:7}}")
    private int diasUmbralCaducidad;

    @Transactional
    public EvaluacionInspeccionAlertasResponse evaluarInspeccionVisual(Long inspeccionId) {
        Inspeccion inspeccion = inspeccionRepository.findByIdConSlotsYEstanteria(inspeccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "INSPECCION_NOT_FOUND",
                        "No existe la inspeccion indicada"
                ));

        Estanteria estanteria = resolverEstanteria(inspeccion);
        if (estanteria == null) {
            log.warn("No se generan alertas: la inspeccion {} apunta a una estanteria sin modelo operativo ({})",
                    inspeccion.getId(), inspeccion.getEstanteriaCodigo());
            return new EvaluacionInspeccionAlertasResponse(inspeccion.getId(), 0, 0, 0, 0);
        }

        List<EstanteriaSlotConfiguracion> slotsConfigurados = slotConfiguracionRepository
                .findActivosByEstanteriaIdOrdenados(estanteria.getId());
        Map<String, EstanteriaSlotConfiguracion> slotsPorId = slotsConfigurados.stream()
                .collect(Collectors.toMap(
                        EstanteriaSlotConfiguracion::getSlotId,
                        Function.identity(),
                        (actual, duplicado) -> actual
                ));
        Map<Integer, EstanteriaSlotConfiguracion> slotsPorOrden = slotsConfigurados.stream()
                .collect(Collectors.toMap(
                        EstanteriaSlotConfiguracion::getOrden,
                        Function.identity(),
                        (actual, duplicado) -> actual
                ));
        List<Long> slotConfiguracionIds = slotsConfigurados.stream()
                .map(EstanteriaSlotConfiguracion::getId)
                .toList();
        Map<Long, AsignacionProductoSlot> asignacionesActivas = slotConfiguracionIds.isEmpty()
                ? Map.of()
                : asignacionProductoSlotRepository
                        .findAsignacionesActivasDeSlots(slotConfiguracionIds, EstadoAsignacionProductoSlot.ACTIVA).stream()
                        .collect(Collectors.toMap(
                                asignacion -> asignacion.getSlotConfiguracion().getId(),
                                Function.identity(),
                                (actual, duplicada) -> actual
                        ));

        ContadorEvaluacion contador = new ContadorEvaluacion();
        List<InspeccionSlotResultado> slotsVisuales = inspeccion.getSlots().stream()
                .sorted(Comparator.comparing(InspeccionSlotResultado::getOrden))
                .toList();

        for (InspeccionSlotResultado slotVisual : slotsVisuales) {
            EstanteriaSlotConfiguracion slotConfigurado = resolverSlotConfigurado(slotVisual, slotsPorId, slotsPorOrden);
            if (slotConfigurado == null) {
                log.warn("No se generan alertas para la inspeccion {} y slot {}: no existe configuracion operativa",
                        inspeccion.getId(), slotVisual.getSlotId());
                continue;
            }

            contador.slotsEvaluados++;
            AsignacionProductoSlot asignacionActiva = asignacionesActivas.get(slotConfigurado.getId());

            if (slotVisual.getConfianza() != null && slotVisual.getConfianza() < umbralConfianzaRevisionManual) {
                crearOReutilizarAlertaVisual(
                        TipoAlerta.REVISION_MANUAL,
                        PrioridadAlerta.MEDIA,
                        mensajeRevisionManual(estanteria, slotVisual),
                        inspeccion,
                        slotVisual,
                        estanteria,
                        slotConfigurado,
                        asignacionActiva,
                        contador
                );
                continue;
            }

            if (slotVisual.getEstadoVisual() == EstadoVisualSlot.VACIO) {
                crearOReutilizarAlertaVisual(
                        TipoAlerta.HUECO_VACIO,
                        PrioridadAlerta.ALTA,
                        "Se ha detectado un hueco vacio en " + estanteria.getCodigo() + ", " + slotVisual.getSlotId()
                                + ", donde se esperaba el producto configurado.",
                        inspeccion,
                        slotVisual,
                        estanteria,
                        slotConfigurado,
                        asignacionActiva,
                        contador
                );
            }

            if (slotVisual.getEstadoVisual() == EstadoVisualSlot.ANOMALIA) {
                crearOReutilizarAlertaVisual(
                        TipoAlerta.ANOMALIA_VISUAL,
                        PrioridadAlerta.ALTA,
                        "Se ha detectado una anomalia visual en " + estanteria.getCodigo() + ", "
                                + slotVisual.getSlotId() + ".",
                        inspeccion,
                        slotVisual,
                        estanteria,
                        slotConfigurado,
                        asignacionActiva,
                        contador
                );
            }

            if (debeAlertarPresenciaTrasRetirada(slotVisual, asignacionActiva)) {
                crearOReutilizarAlertaPorAsignacionYSlot(
                        TipoAlerta.PRESENCIA_TRAS_RETIRADA_PROGRAMADA,
                        PrioridadAlerta.CRITICA,
                        "Se ha detectado presencia visual en " + estanteria.getCodigo() + ", " + slotVisual.getSlotId()
                                + ", tras la fecha de retirada programada.",
                        inspeccion,
                        slotVisual,
                        estanteria,
                        slotConfigurado,
                        asignacionActiva,
                        contador
                );
            }
        }

        return new EvaluacionInspeccionAlertasResponse(
                inspeccion.getId(),
                contador.slotsEvaluados,
                contador.alertasCreadas,
                contador.alertasExistentes,
                contador.notificacionesCreadas
        );
    }

    @Transactional
    public EvaluacionCaducidadResponse evaluarCaducidad() {
        ResultadoRevisionCaducidad resultado = revisarCaducidadesInterno();
        return new EvaluacionCaducidadResponse(
                resultado.asignacionesRevisadas(),
                resultado.alertasCreadas(),
                resultado.alertasExistentes(),
                resultado.notificacionesCreadas()
        );
    }

    @Transactional
    public RevisionCaducidadesResponse revisarCaducidades() {
        ResultadoRevisionCaducidad resultado = revisarCaducidadesInterno();
        return new RevisionCaducidadesResponse(
                resultado.asignacionesRevisadas(),
                resultado.alertasCreadas(),
                resultado.alertasExistentes(),
                "Revisión de caducidades completada."
        );
    }

    @Transactional
    public RevisionTrabajadoresNoDisponiblesResponse revisarTrabajadoresNoDisponiblesAsignados() {
        ResultadoRevisionTrabajadores resultado = revisarTrabajadoresNoDisponiblesInterno(null);
        return new RevisionTrabajadoresNoDisponiblesResponse(
                resultado.asignacionesRevisadas(),
                resultado.estanteriasAfectadas(),
                resultado.alertasCreadas(),
                resultado.alertasExistentes(),
                "Revisión de trabajadores no disponibles completada."
        );
    }

    @Transactional
    public RevisionTrabajadoresNoDisponiblesResponse revisarTrabajadorNoDisponibleAsignado(Long trabajadorId) {
        ResultadoRevisionTrabajadores resultado = revisarTrabajadoresNoDisponiblesInterno(trabajadorId);
        return new RevisionTrabajadoresNoDisponiblesResponse(
                resultado.asignacionesRevisadas(),
                resultado.estanteriasAfectadas(),
                resultado.alertasCreadas(),
                resultado.alertasExistentes(),
                "Revisión de trabajador asignado completada."
        );
    }

    private ResultadoRevisionCaducidad revisarCaducidadesInterno() {
        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(diasUmbralCaducidad);
        List<AsignacionProductoSlot> asignaciones = asignacionProductoSlotRepository
                .findActivasConContexto(EstadoAsignacionProductoSlot.ACTIVA);

        ContadorEvaluacion contador = new ContadorEvaluacion();
        for (AsignacionProductoSlot asignacion : asignaciones) {
            evaluarCaducidadAsignacion(asignacion, hoy, limite, contador);
            evaluarRetiradaProgramada(asignacion, hoy, contador);
        }

        return new ResultadoRevisionCaducidad(
                asignaciones.size(),
                contador.alertasCreadas,
                contador.alertasExistentes,
                contador.notificacionesCreadas
        );
    }

    private ResultadoRevisionTrabajadores revisarTrabajadoresNoDisponiblesInterno(Long trabajadorId) {
        List<TrabajadorEstanteria> asignaciones = trabajadorEstanteriaRepository
                .findActivasConTrabajadorNoDisponible(EnumSet.of(
                        EstadoDisponibilidadTrabajador.AUSENTE,
                        EstadoDisponibilidadTrabajador.ENFERMO
                ))
                .stream()
                .filter(asignacion -> trabajadorId == null
                        || asignacion.getTrabajador().getId().equals(trabajadorId))
                .toList();

        Map<Long, List<TrabajadorEstanteria>> asignacionesPorEstanteria = new LinkedHashMap<>();
        for (TrabajadorEstanteria asignacion : asignaciones) {
            asignacionesPorEstanteria
                    .computeIfAbsent(asignacion.getEstanteria().getId(), id -> new java.util.ArrayList<>())
                    .add(asignacion);
        }

        ContadorEvaluacion contador = new ContadorEvaluacion();
        for (List<TrabajadorEstanteria> asignacionesEstanteria : asignacionesPorEstanteria.values()) {
            Estanteria estanteria = asignacionesEstanteria.get(0).getEstanteria();
            crearOReutilizarAlertaPorEstanteria(
                    TipoAlerta.TRABAJADOR_NO_DISPONIBLE_ASIGNADO,
                    prioridadTrabajadoresNoDisponibles(asignacionesEstanteria),
                    mensajeTrabajadoresNoDisponibles(estanteria, asignacionesEstanteria),
                    estanteria,
                    contador
            );
        }

        Set<Long> estanteriasProcesadas = new HashSet<>(asignacionesPorEstanteria.keySet());
        List<TareaOperativa> tareasActivas = tareaOperativaRepository
                .findConContextoByEstadoIn(ESTADOS_TAREAS_ACTIVAS)
                .stream()
                .filter(tarea -> tarea.getTrabajadorAsignado() != null)
                .filter(tarea -> trabajadorId == null
                        || tarea.getTrabajadorAsignado().getId().equals(trabajadorId))
                .filter(tarea -> trabajadorNoDisponible(tarea.getTrabajadorAsignado()))
                .filter(tarea -> tarea.getEstanteria() != null
                        && Boolean.TRUE.equals(tarea.getEstanteria().getActiva()))
                .filter(tarea -> !estanteriasProcesadas.contains(tarea.getEstanteria().getId()))
                .toList();

        Map<Long, List<TareaOperativa>> tareasPorEstanteria = new LinkedHashMap<>();
        for (TareaOperativa tarea : tareasActivas) {
            tareasPorEstanteria
                    .computeIfAbsent(tarea.getEstanteria().getId(), id -> new java.util.ArrayList<>())
                    .add(tarea);
        }

        for (List<TareaOperativa> tareasEstanteria : tareasPorEstanteria.values()) {
            Estanteria estanteria = tareasEstanteria.get(0).getEstanteria();
            crearOReutilizarAlertaPorEstanteria(
                    TipoAlerta.TRABAJADOR_NO_DISPONIBLE_ASIGNADO,
                    prioridadTareasTrabajadorNoDisponible(tareasEstanteria),
                    mensajeTareasTrabajadorNoDisponible(estanteria, tareasEstanteria),
                    estanteria,
                    contador
            );
        }

        return new ResultadoRevisionTrabajadores(
                asignaciones.size(),
                asignacionesPorEstanteria.size() + tareasPorEstanteria.size(),
                contador.alertasCreadas,
                contador.alertasExistentes,
                contador.notificacionesCreadas
        );
    }

    @Transactional
    public EvaluacionCaducidadResponse evaluarAsignacionActiva(Long asignacionId) {
        AsignacionProductoSlot asignacion = asignacionProductoSlotRepository
                .findActivaConContextoById(asignacionId, EstadoAsignacionProductoSlot.ACTIVA)
                .orElse(null);
        if (asignacion == null) {
            return new EvaluacionCaducidadResponse(0, 0, 0, 0);
        }

        LocalDate hoy = LocalDate.now();
        ContadorEvaluacion contador = new ContadorEvaluacion();
        evaluarCaducidadAsignacion(asignacion, hoy, hoy.plusDays(diasUmbralCaducidad), contador);
        evaluarRetiradaProgramada(asignacion, hoy, contador);

        return new EvaluacionCaducidadResponse(
                1,
                contador.alertasCreadas,
                contador.alertasExistentes,
                contador.notificacionesCreadas
        );
    }

    @Transactional(readOnly = true)
    public List<AlertaResponse> obtenerAlertasAbiertas() {
        return alertaRepository.findAlertasConContextoByEstado(EstadoAlerta.ABIERTA).stream()
                .map(this::toAlertaResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaResponse> obtenerAlertasAbiertasDeSeccion(Long seccionId) {
        return alertaRepository.findAlertasConContextoBySeccionAndEstado(seccionId, EstadoAlerta.ABIERTA).stream()
                .map(this::toAlertaResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaTrabajadorResponse> obtenerAlertasDeTrabajador(Long trabajadorId) {
        return alertaTrabajadorRepository.findNotificacionesConContextoByTrabajador(trabajadorId).stream()
                .map(this::toAlertaTrabajadorResponse)
                .toList();
    }

    @Transactional
    public AlertaResponse resolverAlerta(Long alertaId) {
        Alerta alerta = obtenerAlerta(alertaId);

        if (alerta.getEstadoAlerta() == EstadoAlerta.DESCARTADA) {
            throw ApiException.conflict(
                    "ALERTA_DESCARTADA",
                    "No se puede resolver una alerta descartada"
            );
        }

        if (alerta.getEstadoAlerta() != EstadoAlerta.RESUELTA) {
            alerta.setEstadoAlerta(EstadoAlerta.RESUELTA);
            alerta.setResueltaAt(Instant.now());
        }

        return toAlertaResponse(alerta);
    }

    @Transactional
    public AlertaResponse descartarAlerta(Long alertaId) {
        Alerta alerta = obtenerAlerta(alertaId);

        if (alerta.getEstadoAlerta() == EstadoAlerta.RESUELTA) {
            throw ApiException.conflict(
                    "ALERTA_RESUELTA",
                    "No se puede descartar una alerta resuelta"
            );
        }

        if (alerta.getEstadoAlerta() != EstadoAlerta.DESCARTADA) {
            alerta.setEstadoAlerta(EstadoAlerta.DESCARTADA);
            alerta.setResueltaAt(Instant.now());
        }

        return toAlertaResponse(alerta);
    }

    @Transactional
    public AlertaTrabajadorResponse marcarNotificacionComoLeida(Long alertaTrabajadorId) {
        AlertaTrabajador notificacion = alertaTrabajadorRepository.findByIdConAlerta(alertaTrabajadorId)
                .orElseThrow(() -> ApiException.notFound(
                        "ALERTA_TRABAJADOR_NOT_FOUND",
                        "No existe la notificacion de alerta indicada"
                ));

        if (notificacion.getLeidaAt() == null) {
            notificacion.setLeidaAt(Instant.now());
        }

        return toAlertaTrabajadorResponse(notificacion);
    }

    private Alerta obtenerAlerta(Long alertaId) {
        return alertaRepository.findById(alertaId)
                .orElseThrow(() -> ApiException.notFound(
                        "ALERTA_NOT_FOUND",
                        "No existe la alerta indicada"
                ));
    }

    private Estanteria resolverEstanteria(Inspeccion inspeccion) {
        if (inspeccion.getEstanteria() != null) {
            return inspeccion.getEstanteria();
        }
        return estanteriaRepository.findWithSeccionByCodigoAndActivaTrue(inspeccion.getEstanteriaCodigo())
                .orElse(null);
    }

    private EstanteriaSlotConfiguracion resolverSlotConfigurado(InspeccionSlotResultado slotVisual,
                                                                Map<String, EstanteriaSlotConfiguracion> slotsPorId,
                                                                Map<Integer, EstanteriaSlotConfiguracion> slotsPorOrden) {
        EstanteriaSlotConfiguracion porSlotId = slotsPorId.get(slotVisual.getSlotId());
        if (porSlotId != null) {
            return porSlotId;
        }
        return slotsPorOrden.get(slotVisual.getOrden());
    }

    private boolean debeAlertarPresenciaTrasRetirada(InspeccionSlotResultado slotVisual,
                                                     AsignacionProductoSlot asignacionActiva) {
        if (asignacionActiva == null || asignacionActiva.getFechaRetiradaProgramada() == null) {
            return false;
        }
        boolean retiradaPendiente = asignacionActiva.getFechaRetiradaProgramada().isBefore(LocalDate.now())
                && asignacionActiva.getFechaRetiradaConfirmada() == null;
        boolean hayPresenciaVisual = slotVisual.getEstadoVisual() == EstadoVisualSlot.OCUPADO
                || slotVisual.getEstadoVisual() == EstadoVisualSlot.ANOMALIA;
        return retiradaPendiente && hayPresenciaVisual;
    }

    private void evaluarCaducidadAsignacion(AsignacionProductoSlot asignacion,
                                            LocalDate hoy,
                                            LocalDate limite,
                                            ContadorEvaluacion contador) {
        if (asignacion.getFechaCaducidad() == null
                || asignacion.getFechaCaducidad().isBefore(hoy)
                || asignacion.getFechaCaducidad().isAfter(limite)) {
            return;
        }

        EstanteriaSlotConfiguracion slotConfigurado = asignacion.getSlotConfiguracion();
        Estanteria estanteria = slotConfigurado.getEstanteria();
        PrioridadAlerta prioridad = asignacion.getFechaCaducidad().isAfter(hoy)
                ? PrioridadAlerta.MEDIA
                : PrioridadAlerta.ALTA;

        crearOReutilizarAlertaPorAsignacion(
                TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR,
                prioridad,
                "El producto " + nombreProductoAsignado(asignacion) + " del slot " + slotConfigurado.getSlotId()
                        + " esta proximo a caducar.",
                estanteria,
                slotConfigurado,
                asignacion,
                contador
        );
    }

    private void evaluarRetiradaProgramada(AsignacionProductoSlot asignacion,
                                           LocalDate hoy,
                                           ContadorEvaluacion contador) {
        if (asignacion.getFechaRetiradaConfirmada() != null) {
            return;
        }

        boolean retiradaProgramadaVencida = asignacion.getFechaRetiradaProgramada() != null
                && asignacion.getFechaRetiradaProgramada().isBefore(hoy);
        boolean productoCaducado = asignacion.getFechaCaducidad() != null
                && asignacion.getFechaCaducidad().isBefore(hoy);
        if (!retiradaProgramadaVencida && !productoCaducado) {
            return;
        }

        EstanteriaSlotConfiguracion slotConfigurado = asignacion.getSlotConfiguracion();
        Estanteria estanteria = slotConfigurado.getEstanteria();
        String mensaje = productoCaducado
                ? "El producto " + nombreProductoAsignado(asignacion) + " del slot " + slotConfigurado.getSlotId()
                        + " ya esta caducado y debe retirarse."
                : "La retirada programada del producto " + nombreProductoAsignado(asignacion)
                        + " en " + slotConfigurado.getSlotId() + " esta pendiente.";
        crearOReutilizarAlertaPorAsignacion(
                TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE,
                PrioridadAlerta.ALTA,
                mensaje,
                estanteria,
                slotConfigurado,
                asignacion,
                contador
        );
    }

    private String nombreProductoAsignado(AsignacionProductoSlot asignacion) {
        if (asignacion.getProductoProveedor() == null || asignacion.getProductoProveedor().getProducto() == null) {
            return "asignado";
        }
        Producto producto = asignacion.getProductoProveedor().getProducto();
        if (producto.getNombre() != null && !producto.getNombre().isBlank()) {
            return producto.getNombre();
        }
        if (producto.getCodigoInterno() != null && !producto.getCodigoInterno().isBlank()) {
            return producto.getCodigoInterno();
        }
        return "asignado";
    }

    private PrioridadAlerta prioridadTrabajadoresNoDisponibles(List<TrabajadorEstanteria> asignaciones) {
        boolean hayAltaPrioridad = asignaciones.stream()
                .map(TrabajadorEstanteria::getTrabajador)
                .anyMatch(trabajador -> !Boolean.TRUE.equals(trabajador.getActivo())
                        || trabajador.getEstadoDisponibilidad() == EstadoDisponibilidadTrabajador.ENFERMO);
        return hayAltaPrioridad ? PrioridadAlerta.ALTA : PrioridadAlerta.MEDIA;
    }

    private PrioridadAlerta prioridadTareasTrabajadorNoDisponible(List<TareaOperativa> tareas) {
        boolean hayEnProgreso = tareas.stream()
                .anyMatch(tarea -> tarea.getEstadoTarea() == EstadoTareaOperativa.EN_PROGRESO);
        return hayEnProgreso ? PrioridadAlerta.ALTA : PrioridadAlerta.MEDIA;
    }

    private String mensajeTrabajadoresNoDisponibles(Estanteria estanteria, List<TrabajadorEstanteria> asignaciones) {
        String trabajadores = asignaciones.stream()
                .map(asignacion -> nombreTrabajadorConDisponibilidad(asignacion.getTrabajador()))
                .collect(Collectors.joining(", "));
        return "La estanteria " + estanteria.getCodigo()
                + " tiene trabajadores asignados no disponibles: " + trabajadores + ".";
    }

    private String mensajeTareasTrabajadorNoDisponible(Estanteria estanteria, List<TareaOperativa> tareas) {
        String trabajadores = tareas.stream()
                .map(TareaOperativa::getTrabajadorAsignado)
                .distinct()
                .map(this::nombreTrabajadorConDisponibilidad)
                .collect(Collectors.joining(", "));
        return "La estanteria " + estanteria.getCodigo()
                + " tiene tareas activas asignadas a trabajadores no disponibles: " + trabajadores + ".";
    }

    private boolean trabajadorNoDisponible(Trabajador trabajador) {
        return !Boolean.TRUE.equals(trabajador.getActivo())
                || trabajador.getEstadoDisponibilidad() == EstadoDisponibilidadTrabajador.AUSENTE
                || trabajador.getEstadoDisponibilidad() == EstadoDisponibilidadTrabajador.ENFERMO;
    }

    private String nombreTrabajadorConDisponibilidad(Trabajador trabajador) {
        String nombre = java.util.stream.Stream.of(trabajador.getNombre(), trabajador.getApellidos())
                .filter(valor -> valor != null && !valor.isBlank())
                .collect(Collectors.joining(" "));
        String disponibilidad = !Boolean.TRUE.equals(trabajador.getActivo())
                ? "INACTIVO"
                : trabajador.getEstadoDisponibilidad() != null
                ? trabajador.getEstadoDisponibilidad().name()
                : "NO DISPONIBLE";
        return (nombre.isBlank() ? "Trabajador " + trabajador.getId() : nombre) + " (" + disponibilidad + ")";
    }

    private void crearOReutilizarAlertaVisual(TipoAlerta tipo,
                                              PrioridadAlerta prioridad,
                                              String mensaje,
                                              Inspeccion inspeccion,
                                              InspeccionSlotResultado slotVisual,
                                              Estanteria estanteria,
                                              EstanteriaSlotConfiguracion slotConfigurado,
                                              AsignacionProductoSlot asignacionActiva,
                                              ContadorEvaluacion contador) {
        List<Alerta> existentes = alertaRepository.findAlertasVisualesAbiertas(
                tipo,
                EstadoAlerta.ABIERTA,
                estanteria.getId(),
                slotConfigurado.getId()
        );
        if (!existentes.isEmpty()) {
            Alerta alertaExistente = existentes.get(0);
            contador.alertasExistentes++;
            notificarDestinatarios(alertaExistente, contador);
            tareaOperativaService.crearAutomaticaSiNoExiste(alertaExistente);
            return;
        }

        Alerta alerta = construirAlerta(tipo, prioridad, mensaje, inspeccion, slotVisual, estanteria,
                slotConfigurado, asignacionActiva);
        alertaRepository.save(alerta);
        contador.alertasCreadas++;
        notificarDestinatarios(alerta, contador);
        tareaOperativaService.crearAutomaticaSiNoExiste(alerta);
    }

    private void crearOReutilizarAlertaPorAsignacion(TipoAlerta tipo,
                                                     PrioridadAlerta prioridad,
                                                     String mensaje,
                                                     Estanteria estanteria,
                                                     EstanteriaSlotConfiguracion slotConfigurado,
                                                     AsignacionProductoSlot asignacionActiva,
                                                     ContadorEvaluacion contador) {
        List<Alerta> existentes = alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                tipo,
                EstadoAlerta.ABIERTA,
                asignacionActiva.getId(),
                slotConfigurado.getId()
        );
        if (!existentes.isEmpty()) {
            Alerta alertaExistente = existentes.get(0);
            contador.alertasExistentes++;
            notificarDestinatarios(alertaExistente, contador);
            tareaOperativaService.crearAutomaticaSiNoExiste(alertaExistente);
            return;
        }

        Alerta alerta = construirAlerta(tipo, prioridad, mensaje, null, null, estanteria,
                slotConfigurado, asignacionActiva);
        alertaRepository.save(alerta);
        contador.alertasCreadas++;
        notificarDestinatarios(alerta, contador);
        tareaOperativaService.crearAutomaticaSiNoExiste(alerta);
    }

    private void crearOReutilizarAlertaPorAsignacionYSlot(TipoAlerta tipo,
                                                          PrioridadAlerta prioridad,
                                                          String mensaje,
                                                          Inspeccion inspeccion,
                                                          InspeccionSlotResultado slotVisual,
                                                          Estanteria estanteria,
                                                          EstanteriaSlotConfiguracion slotConfigurado,
                                                          AsignacionProductoSlot asignacionActiva,
                                                          ContadorEvaluacion contador) {
        List<Alerta> existentes = alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                tipo,
                EstadoAlerta.ABIERTA,
                asignacionActiva.getId(),
                slotConfigurado.getId()
        );
        if (!existentes.isEmpty()) {
            Alerta alertaExistente = existentes.get(0);
            contador.alertasExistentes++;
            notificarDestinatarios(alertaExistente, contador);
            tareaOperativaService.crearAutomaticaSiNoExiste(alertaExistente);
            return;
        }

        Alerta alerta = construirAlerta(tipo, prioridad, mensaje, inspeccion, slotVisual, estanteria,
                slotConfigurado, asignacionActiva);
        alertaRepository.save(alerta);
        contador.alertasCreadas++;
        notificarDestinatarios(alerta, contador);
        tareaOperativaService.crearAutomaticaSiNoExiste(alerta);
    }

    private void crearOReutilizarAlertaPorEstanteria(TipoAlerta tipo,
                                                     PrioridadAlerta prioridad,
                                                     String mensaje,
                                                     Estanteria estanteria,
                                                     ContadorEvaluacion contador) {
        List<Alerta> existentes = alertaRepository.findAlertasAbiertasPorEstanteria(
                tipo,
                EstadoAlerta.ABIERTA,
                estanteria.getId()
        );
        if (!existentes.isEmpty()) {
            Alerta alertaExistente = existentes.get(0);
            contador.alertasExistentes++;
            notificarDestinatarios(alertaExistente, contador);
            tareaOperativaService.crearAutomaticaSiNoExiste(alertaExistente);
            return;
        }

        Alerta alerta = construirAlerta(tipo, prioridad, mensaje, null, null, estanteria, null, null);
        alertaRepository.save(alerta);
        contador.alertasCreadas++;
        notificarDestinatarios(alerta, contador);
        tareaOperativaService.crearAutomaticaSiNoExiste(alerta);
    }

    private Alerta construirAlerta(TipoAlerta tipo,
                                   PrioridadAlerta prioridad,
                                   String mensaje,
                                   Inspeccion inspeccion,
                                   InspeccionSlotResultado slotVisual,
                                   Estanteria estanteria,
                                   EstanteriaSlotConfiguracion slotConfigurado,
                                   AsignacionProductoSlot asignacionActiva) {
        Alerta alerta = new Alerta();
        alerta.setTipoAlerta(tipo);
        alerta.setPrioridad(prioridad);
        alerta.setEstadoAlerta(EstadoAlerta.ABIERTA);
        alerta.setMensaje(mensaje);
        alerta.setInspeccion(inspeccion);
        alerta.setInspeccionSlotResultado(slotVisual);
        alerta.setSeccion(estanteria.getSeccion());
        alerta.setEstanteria(estanteria);
        alerta.setSlotConfiguracion(slotConfigurado);
        alerta.setAsignacionProductoSlot(asignacionActiva);
        return alerta;
    }

    private void notificarDestinatarios(Alerta alerta, ContadorEvaluacion contador) {
        if (alerta.getSeccion() == null) {
            log.warn("La alerta {} no tiene seccion asociada y no puede asignarse a trabajadores", alerta.getId());
            return;
        }

        List<SeccionEncargado> encargados = seccionEncargadoRepository
                .findEncargadosActivosBySeccionId(alerta.getSeccion().getId());
        if (encargados.isEmpty()) {
            log.warn("La alerta {} se ha persistido sin destinatarios porque la seccion {} no tiene encargados activos",
                    alerta.getId(), alerta.getSeccion().getId());
            return;
        }

        for (SeccionEncargado encargado : encargados) {
            Long trabajadorId = encargado.getTrabajador().getId();
            if (alertaTrabajadorRepository.existsByAlertaIdAndTrabajadorId(alerta.getId(), trabajadorId)) {
                continue;
            }

            AlertaTrabajador notificacion = new AlertaTrabajador();
            notificacion.setAlerta(alerta);
            notificacion.setTrabajador(encargado.getTrabajador());
            alertaTrabajadorRepository.save(notificacion);
            contador.notificacionesCreadas++;
        }
    }

    private String mensajeRevisionManual(Estanteria estanteria, InspeccionSlotResultado slotVisual) {
        return "La confianza visual de " + estanteria.getCodigo() + ", " + slotVisual.getSlotId()
                + ", esta por debajo del umbral de revision manual.";
    }

    private AlertaTrabajadorResponse toAlertaTrabajadorResponse(AlertaTrabajador notificacion) {
        return new AlertaTrabajadorResponse(
                notificacion.getId(),
                toAlertaResponse(notificacion.getAlerta()),
                notificacion.getNotificadaAt(),
                notificacion.getLeidaAt() != null,
                notificacion.getLeidaAt()
        );
    }

    private AlertaResponse toAlertaResponse(Alerta alerta) {
        StockResumen stock = toStockResumen(alerta.getAsignacionProductoSlot());
        return new AlertaResponse(
                alerta.getId(),
                alerta.getTipoAlerta(),
                alerta.getPrioridad(),
                alerta.getEstadoAlerta(),
                alerta.getMensaje(),
                alerta.getCreatedAt(),
                alerta.getResueltaAt(),
                alerta.getInspeccion() == null ? null : alerta.getInspeccion().getId(),
                alerta.getInspeccion() == null ? null : alerta.getInspeccion().getImagenPath(),
                toSeccionResponse(alerta.getSeccion()),
                toEstanteriaResumenResponse(alerta.getEstanteria()),
                toAlertaSlotResponse(alerta.getSlotConfiguracion()),
                toAlertaAsignacionResponse(alerta.getAsignacionProductoSlot()),
                stock.productoId(),
                stock.productoCodigo(),
                stock.productoNombre(),
                stock.proveedorId(),
                stock.proveedorNombre(),
                stock.stockDisponible(),
                stock.stockMensaje()
        );
    }

    private StockResumen toStockResumen(AsignacionProductoSlot asignacion) {
        if (asignacion == null || asignacion.getProductoProveedor() == null) {
            return StockResumen.sinDato();
        }

        ProductoProveedor productoProveedor = asignacion.getProductoProveedor();
        Producto producto = productoProveedor.getProducto();
        Proveedor proveedor = productoProveedor.getProveedor();
        Boolean stockDisponible = productoProveedor.getStockDisponible();

        return new StockResumen(
                producto != null ? producto.getId() : null,
                producto != null ? producto.getCodigoInterno() : null,
                producto != null ? producto.getNombre() : null,
                proveedor != null ? proveedor.getId() : null,
                proveedor != null ? proveedor.getNombre() : null,
                stockDisponible,
                stockMensaje(stockDisponible)
        );
    }

    private SeccionResponse toSeccionResponse(Seccion seccion) {
        if (seccion == null) {
            return null;
        }
        return new SeccionResponse(
                seccion.getId(),
                seccion.getCodigo(),
                seccion.getNombre(),
                seccion.getDescripcion(),
                seccion.getActiva()
        );
    }

    private EstanteriaResumenResponse toEstanteriaResumenResponse(Estanteria estanteria) {
        if (estanteria == null) {
            return null;
        }
        return new EstanteriaResumenResponse(
                estanteria.getId(),
                estanteria.getCodigo(),
                estanteria.getNombre(),
                estanteria.getDescripcion(),
                estanteria.getActiva()
        );
    }

    private AlertaSlotResponse toAlertaSlotResponse(EstanteriaSlotConfiguracion slot) {
        if (slot == null) {
            return null;
        }
        return new AlertaSlotResponse(
                slot.getId(),
                slot.getSlotId(),
                slot.getOrden(),
                toProductoResumenResponse(slot.getProducto())
        );
    }

    private AlertaAsignacionResponse toAlertaAsignacionResponse(AsignacionProductoSlot asignacion) {
        if (asignacion == null) {
            return null;
        }

        ProductoProveedor productoProveedor = asignacion.getProductoProveedor();
        return new AlertaAsignacionResponse(
                asignacion.getId(),
                toProductoResumenResponse(productoProveedor.getProducto()),
                toProveedorResumenResponse(productoProveedor.getProveedor()),
                productoProveedor.getClaveProductoProveedor(),
                productoProveedor.getStockDisponible(),
                stockMensaje(productoProveedor.getStockDisponible()),
                asignacion.getFechaCaducidad(),
                asignacion.getFechaRetiradaProgramada(),
                asignacion.getEstadoAsignacion()
        );
    }

    private String stockMensaje(Boolean stockDisponible) {
        if (stockDisponible == null) {
            return "Sin dato de stock";
        }
        return stockDisponible
                ? "Stock disponible: Sí"
                : "Stock disponible: No · requiere pedido o reposición externa";
    }

    private ProductoResumenResponse toProductoResumenResponse(Producto producto) {
        if (producto == null) {
            return null;
        }
        return new ProductoResumenResponse(
                producto.getId(),
                producto.getProductoUuid(),
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getActivo()
        );
    }

    private ProveedorResumenResponse toProveedorResumenResponse(Proveedor proveedor) {
        if (proveedor == null) {
            return null;
        }
        return new ProveedorResumenResponse(
                proveedor.getId(),
                proveedor.getCodigo(),
                proveedor.getNombre(),
                proveedor.getDescripcion()
        );
    }

    private static class ContadorEvaluacion {
        private int slotsEvaluados;
        private int alertasCreadas;
        private int alertasExistentes;
        private int notificacionesCreadas;
    }

    private record ResultadoRevisionCaducidad(
            int asignacionesRevisadas,
            int alertasCreadas,
            int alertasExistentes,
            int notificacionesCreadas
    ) {
    }

    private record ResultadoRevisionTrabajadores(
            int asignacionesRevisadas,
            int estanteriasAfectadas,
            int alertasCreadas,
            int alertasExistentes,
            int notificacionesCreadas
    ) {
    }

    private record StockResumen(
            Long productoId,
            String productoCodigo,
            String productoNombre,
            Long proveedorId,
            String proveedorNombre,
            Boolean stockDisponible,
            String stockMensaje
    ) {
        private static StockResumen sinDato() {
            return new StockResumen(null, null, null, null, null, null, "Sin dato de stock");
        }
    }
}
