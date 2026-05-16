package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoVisualSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.entity.InspeccionSlotResultado;
import com.proyectofincurso.estanteria.persistence.entity.Plano;
import com.proyectofincurso.estanteria.persistence.entity.PlanoEstanteriaLayout;
import com.proyectofincurso.estanteria.persistence.entity.PlanoZona;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.SeccionEncargado;
import com.proyectofincurso.estanteria.persistence.entity.TareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.repository.AlertaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoEstanteriaLayoutRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoZonaRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.web.dto.EmpresaResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoAlertaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoEstanteriaOperativaResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoOperativoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoResponsableResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoSlotOperativoResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoTareaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoUltimaInspeccionResponse;
import com.proyectofincurso.estanteria.web.dto.PlanoZonaOperativaResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanoOperativoService {

    private static final String ESTADO_SIN_DATOS = "SIN_DATOS";

    private final PlanoRepository planoRepository;
    private final PlanoZonaRepository planoZonaRepository;
    private final PlanoEstanteriaLayoutRepository planoEstanteriaLayoutRepository;
    private final EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    private final InspeccionRepository inspeccionRepository;
    private final AlertaRepository alertaRepository;
    private final TareaOperativaRepository tareaOperativaRepository;
    private final SeccionEncargadoRepository seccionEncargadoRepository;

    @Transactional(readOnly = true)
    public PlanoOperativoResponse obtenerPlanoOperativo(String codigo) {
        Plano plano = planoRepository.findWithEmpresaByCodigo(codigo.trim())
                .orElseThrow(() -> ApiException.notFound(
                        "PLANO_NOT_FOUND",
                        "No existe un plano con el codigo indicado"
                ));

        List<PlanoZona> zonas = planoZonaRepository.findByPlanoIdOrderByIdAsc(plano.getId());
        List<PlanoEstanteriaLayout> layouts = planoEstanteriaLayoutRepository.findByPlanoIdOrderByIdAsc(plano.getId());
        List<Long> estanteriaIds = layouts.stream()
                .map(layout -> layout.getEstanteria().getId())
                .toList();
        List<Long> seccionIds = zonas.stream()
                .map(zona -> zona.getSeccion().getId())
                .distinct()
                .toList();

        Map<Long, List<EstanteriaSlotConfiguracion>> slotsPorEstanteria = cargarSlotsPorEstanteria(estanteriaIds);
        Map<Long, List<Alerta>> alertasPorEstanteria = cargarAlertasPorEstanteria(estanteriaIds);
        Map<Long, List<TareaOperativa>> tareasPorEstanteria = cargarTareasPorEstanteria(estanteriaIds);
        Map<Long, List<PlanoResponsableResponse>> responsablesPorSeccion = cargarResponsablesPorSeccion(seccionIds);

        return new PlanoOperativoResponse(
                plano.getId(),
                plano.getCodigo(),
                plano.getNombre(),
                plano.getDescripcion(),
                plano.getAncho(),
                plano.getAlto(),
                toEmpresaResponse(plano.getEmpresa()),
                zonas.stream()
                        .map(zona -> toZonaOperativaResponse(
                                zona,
                                responsablesPorSeccion.getOrDefault(zona.getSeccion().getId(), List.of())
                        ))
                        .toList(),
                layouts.stream()
                        .map(layout -> toEstanteriaOperativaResponse(
                                layout,
                                slotsPorEstanteria.getOrDefault(layout.getEstanteria().getId(), List.of()),
                                alertasPorEstanteria.getOrDefault(layout.getEstanteria().getId(), List.of()),
                                tareasPorEstanteria.getOrDefault(layout.getEstanteria().getId(), List.of())
                        ))
                        .toList()
        );
    }

    private Map<Long, List<EstanteriaSlotConfiguracion>> cargarSlotsPorEstanteria(List<Long> estanteriaIds) {
        if (estanteriaIds.isEmpty()) {
            return Map.of();
        }

        return slotConfiguracionRepository.findActivosByEstanteriaIdsOrdenados(estanteriaIds).stream()
                .collect(Collectors.groupingBy(slot -> slot.getEstanteria().getId()));
    }

    private Map<Long, List<Alerta>> cargarAlertasPorEstanteria(List<Long> estanteriaIds) {
        if (estanteriaIds.isEmpty()) {
            return Map.of();
        }

        return alertaRepository
                .findAlertasConContextoByEstanteriasAndEstado(estanteriaIds, EstadoAlerta.ABIERTA).stream()
                .collect(Collectors.groupingBy(alerta -> alerta.getEstanteria().getId()));
    }

    private Map<Long, List<TareaOperativa>> cargarTareasPorEstanteria(List<Long> estanteriaIds) {
        if (estanteriaIds.isEmpty()) {
            return Map.of();
        }

        return tareaOperativaRepository.findConContextoByEstanteriasAndEstadoIn(
                        estanteriaIds,
                        List.of(EstadoTareaOperativa.PENDIENTE, EstadoTareaOperativa.EN_PROGRESO)
                ).stream()
                .collect(Collectors.groupingBy(tarea -> tarea.getEstanteria().getId()));
    }

    private Map<Long, List<PlanoResponsableResponse>> cargarResponsablesPorSeccion(List<Long> seccionIds) {
        if (seccionIds.isEmpty()) {
            return Map.of();
        }

        return seccionEncargadoRepository.findEncargadosActivosBySeccionIds(seccionIds).stream()
                .collect(Collectors.groupingBy(
                        asignacion -> asignacion.getSeccion().getId(),
                        Collectors.mapping(this::toPlanoResponsableResponse, Collectors.toList())
                ));
    }

    private PlanoEstanteriaOperativaResponse toEstanteriaOperativaResponse(PlanoEstanteriaLayout layout,
                                                                           List<EstanteriaSlotConfiguracion> slotsConfigurados,
                                                                           List<Alerta> alertas,
                                                                           List<TareaOperativa> tareas) {
        Estanteria estanteria = layout.getEstanteria();
        Optional<Inspeccion> ultimaInspeccion = inspeccionRepository
                .findUltimasConSlotsByEstanteriaId(estanteria.getId(), PageRequest.of(0, 1))
                .stream()
                .findFirst();

        Map<String, InspeccionSlotResultado> resultadosPorSlot = ultimaInspeccion
                .map(this::indexarResultadosPorSlot)
                .orElseGet(Map::of);

        Map<String, List<Alerta>> alertasPorSlot = alertas.stream()
                .filter(alerta -> alerta.getSlotConfiguracion() != null)
                .collect(Collectors.groupingBy(alerta -> alerta.getSlotConfiguracion().getSlotId()));

        List<PlanoSlotOperativoResponse> slots = slotsConfigurados.stream()
                .sorted(Comparator.comparing(EstanteriaSlotConfiguracion::getOrden))
                .map(slot -> toSlotOperativoResponse(slot, resultadosPorSlot.get(slot.getSlotId()), alertasPorSlot.getOrDefault(slot.getSlotId(), List.of())))
                .toList();

        return new PlanoEstanteriaOperativaResponse(
                layout.getId(),
                layout.getPlanoZona().getId(),
                layout.getX(),
                layout.getY(),
                layout.getWidth(),
                layout.getHeight(),
                layout.getOrientacion(),
                toEstanteriaResumenResponse(estanteria),
                ultimaInspeccion.map(this::toUltimaInspeccionResponse).orElse(null),
                slots,
                alertas.stream().map(this::toAlertaResumenResponse).toList(),
                tareas.stream().map(this::toTareaResumenResponse).toList()
        );
    }

    private Map<String, InspeccionSlotResultado> indexarResultadosPorSlot(Inspeccion inspeccion) {
        return inspeccion.getSlots().stream()
                .collect(Collectors.toMap(
                        InspeccionSlotResultado::getSlotId,
                        Function.identity(),
                        (actual, duplicado) -> actual
                ));
    }

    private PlanoSlotOperativoResponse toSlotOperativoResponse(EstanteriaSlotConfiguracion slot,
                                                               InspeccionSlotResultado resultado,
                                                               List<Alerta> alertas) {
        EstadoVisualSlot estadoVisual = resultado == null ? null : resultado.getEstadoVisual();

        return new PlanoSlotOperativoResponse(
                slot.getSlotId(),
                slot.getOrden(),
                toProductoResumenResponse(slot.getProducto()),
                estadoVisual == null ? ESTADO_SIN_DATOS : estadoVisual.name(),
                resultado == null ? null : resultado.getConfianza(),
                !alertas.isEmpty(),
                alertas.stream()
                        .map(alerta -> alerta.getTipoAlerta().name())
                        .distinct()
                        .toList()
        );
    }

    private PlanoZonaOperativaResponse toZonaOperativaResponse(PlanoZona zona,
                                                               List<PlanoResponsableResponse> responsables) {
        return new PlanoZonaOperativaResponse(
                zona.getId(),
                toSeccionResponse(zona.getSeccion()),
                zona.getX(),
                zona.getY(),
                zona.getWidth(),
                zona.getHeight(),
                responsables
        );
    }

    private PlanoResponsableResponse toPlanoResponsableResponse(SeccionEncargado seccionEncargado) {
        Trabajador trabajador = seccionEncargado.getTrabajador();

        return new PlanoResponsableResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getTipoTrabajador(),
                seccionEncargado.getResponsablePrincipal()
        );
    }

    private PlanoUltimaInspeccionResponse toUltimaInspeccionResponse(Inspeccion inspeccion) {
        return new PlanoUltimaInspeccionResponse(
                inspeccion.getId(),
                inspeccion.getCreatedAt(),
                inspeccion.getCapturadaEn(),
                inspeccion.getEstadoGeneralVisual(),
                inspeccion.getOcupados(),
                inspeccion.getVacios(),
                inspeccion.getAnomalias()
        );
    }

    private PlanoAlertaResumenResponse toAlertaResumenResponse(Alerta alerta) {
        return new PlanoAlertaResumenResponse(
                alerta.getId(),
                alerta.getTipoAlerta(),
                alerta.getPrioridad(),
                alerta.getMensaje(),
                alerta.getSlotConfiguracion() == null ? null : alerta.getSlotConfiguracion().getSlotId()
        );
    }

    private PlanoTareaResumenResponse toTareaResumenResponse(TareaOperativa tarea) {
        return new PlanoTareaResumenResponse(
                tarea.getId(),
                tarea.getTipoTarea(),
                tarea.getEstadoTarea(),
                tarea.getPrioridad(),
                tarea.getTitulo(),
                tarea.getSlotConfiguracion() == null ? null : tarea.getSlotConfiguracion().getSlotId()
        );
    }

    private EmpresaResponse toEmpresaResponse(Empresa empresa) {
        return new EmpresaResponse(
                empresa.getId(),
                empresa.getCodigo(),
                empresa.getNombre(),
                empresa.getDescripcion(),
                empresa.getActiva()
        );
    }

    private SeccionResponse toSeccionResponse(Seccion seccion) {
        return new SeccionResponse(
                seccion.getId(),
                seccion.getCodigo(),
                seccion.getNombre(),
                seccion.getDescripcion(),
                seccion.getActiva()
        );
    }

    private EstanteriaResumenResponse toEstanteriaResumenResponse(Estanteria estanteria) {
        return new EstanteriaResumenResponse(
                estanteria.getId(),
                estanteria.getCodigo(),
                estanteria.getNombre(),
                estanteria.getDescripcion(),
                estanteria.getActiva()
        );
    }

    private ProductoResumenResponse toProductoResumenResponse(Producto producto) {
        UUID productoUuid = producto.getProductoUuid();

        return new ProductoResumenResponse(
                producto.getId(),
                productoUuid,
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getImagenUrl(),
                producto.getActivo()
        );
    }
}
