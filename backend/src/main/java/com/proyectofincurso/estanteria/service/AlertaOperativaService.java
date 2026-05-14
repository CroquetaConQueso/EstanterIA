package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.AlertaTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
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
import com.proyectofincurso.estanteria.persistence.repository.AlertaRepository;
import com.proyectofincurso.estanteria.persistence.repository.AlertaTrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.web.dto.AlertaAsignacionResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaSlotResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaTrabajadorResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.EvaluacionCaducidadResponse;
import com.proyectofincurso.estanteria.web.dto.EvaluacionInspeccionAlertasResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProveedorResumenResponse;
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
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertaOperativaService {

    private final InspeccionRepository inspeccionRepository;
    private final EstanteriaRepository estanteriaRepository;
    private final EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    private final AsignacionProductoSlotRepository asignacionProductoSlotRepository;
    private final SeccionEncargadoRepository seccionEncargadoRepository;
    private final AlertaRepository alertaRepository;
    private final AlertaTrabajadorRepository alertaTrabajadorRepository;
    private final TareaOperativaService tareaOperativaService;

    @Value("${alertas.revision-manual.umbral-confianza:0.70}")
    private double umbralConfianzaRevisionManual;

    @Value("${alertas.caducidad.dias-umbral:7}")
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
        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(diasUmbralCaducidad);
        List<AsignacionProductoSlot> asignaciones = asignacionProductoSlotRepository
                .findActivasConCaducidadEntre(EstadoAsignacionProductoSlot.ACTIVA, hoy, limite);

        ContadorEvaluacion contador = new ContadorEvaluacion();
        for (AsignacionProductoSlot asignacion : asignaciones) {
            EstanteriaSlotConfiguracion slotConfigurado = asignacion.getSlotConfiguracion();
            Estanteria estanteria = slotConfigurado.getEstanteria();
            crearOReutilizarAlertaPorAsignacion(
                    TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR,
                    PrioridadAlerta.MEDIA,
                    "El producto asignado a " + estanteria.getCodigo() + ", " + slotConfigurado.getSlotId()
                            + ", caduca el " + asignacion.getFechaCaducidad() + ".",
                    estanteria,
                    slotConfigurado,
                    asignacion,
                    contador
            );
        }

        return new EvaluacionCaducidadResponse(
                asignaciones.size(),
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
        boolean retiradaPendiente = !asignacionActiva.getFechaRetiradaProgramada().isAfter(LocalDate.now())
                && asignacionActiva.getFechaRetiradaConfirmada() == null;
        boolean hayPresenciaVisual = slotVisual.getEstadoVisual() == EstadoVisualSlot.OCUPADO
                || slotVisual.getEstadoVisual() == EstadoVisualSlot.ANOMALIA;
        return retiradaPendiente && hayPresenciaVisual;
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
        List<Alerta> existentes = alertaRepository.findAlertasAbiertasPorAsignacion(
                tipo,
                EstadoAlerta.ABIERTA,
                asignacionActiva.getId()
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
        return new AlertaResponse(
                alerta.getId(),
                alerta.getTipoAlerta(),
                alerta.getPrioridad(),
                alerta.getEstadoAlerta(),
                alerta.getMensaje(),
                alerta.getCreatedAt(),
                alerta.getResueltaAt(),
                toSeccionResponse(alerta.getSeccion()),
                toEstanteriaResumenResponse(alerta.getEstanteria()),
                toAlertaSlotResponse(alerta.getSlotConfiguracion()),
                toAlertaAsignacionResponse(alerta.getAsignacionProductoSlot())
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
                asignacion.getFechaCaducidad(),
                asignacion.getFechaRetiradaProgramada(),
                asignacion.getEstadoAsignacion()
        );
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
                producto.getDescripcion()
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
}
