package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.EstadoVisualSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.entity.InspeccionSlotResultado;
import com.proyectofincurso.estanteria.persistence.entity.Plano;
import com.proyectofincurso.estanteria.persistence.entity.PlanoEstanteriaLayout;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoEstanteriaLayoutRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualFiltrosResponse;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualPeriodoResponse;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualResponse;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoSinVaciosResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoVaciadoResponse;
import com.proyectofincurso.estanteria.web.dto.ResumenDiaSemanaResponse;
import com.proyectofincurso.estanteria.web.dto.SlotVaciadoResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InformeRotacionVisualService {

    private static final int DIAS_PERIODO_DEFECTO = 30;
    private static final int LIMITE_RANKING = 10;

    private final InspeccionRepository inspeccionRepository;
    private final EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    private final PlanoRepository planoRepository;
    private final PlanoEstanteriaLayoutRepository planoEstanteriaLayoutRepository;
    private final SeccionRepository seccionRepository;
    private final EstanteriaRepository estanteriaRepository;

    @Transactional(readOnly = true)
    public InformeRotacionVisualResponse generarInforme(String planoCodigo,
                                                        Long seccionId,
                                                        String estanteriaCodigo,
                                                        LocalDate fechaDesde,
                                                        LocalDate fechaHasta) {
        LocalDate hasta = fechaHasta != null ? fechaHasta : LocalDate.now();
        LocalDate desde = fechaDesde != null ? fechaDesde : hasta.minusDays(DIAS_PERIODO_DEFECTO - 1L);
        if (desde.isAfter(hasta)) {
            throw ApiException.badRequest(
                    "INFORME_FECHAS_INVALIDAS",
                    "La fecha desde no puede ser posterior a la fecha hasta."
            );
        }

        Plano plano = resolverPlano(normalizar(planoCodigo));
        Seccion seccion = resolverSeccion(seccionId);
        Estanteria estanteria = resolverEstanteria(normalizar(estanteriaCodigo), seccionId);

        Set<Long> estanteriasDelPlano = resolverEstanteriasDelPlano(plano);
        ZoneId zona = ZoneId.systemDefault();
        Instant desdeInstant = desde.atStartOfDay(zona).toInstant();
        Instant hastaExclusiva = hasta.plusDays(1).atStartOfDay(zona).toInstant();

        // El informe mide estados visuales de inspeccion, no ventas: el filtro de plano solo acota
        // que estanterias participan en el calculo sin reinterpretar el historico operativo.
        List<Inspeccion> inspecciones = cargarInspeccionesParaInforme(
                desdeInstant,
                hastaExclusiva,
                seccionId,
                estanteria
        ).stream()
                .filter(inspeccion -> inspeccion.getEstanteria() != null)
                .filter(inspeccion -> estanteriasDelPlano == null || estanteriasDelPlano.contains(inspeccion.getEstanteria().getId()))
                .sorted(Comparator.comparing(
                        this::fechaInspeccion,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .toList();

        Map<SlotConfigKey, EstanteriaSlotConfiguracion> slotsConfigurados = cargarSlotsConfigurados(inspecciones);
        Aggregation aggregation = agregarResultados(inspecciones, slotsConfigurados, zona);

        return new InformeRotacionVisualResponse(
                new InformeRotacionVisualPeriodoResponse(desde, hasta),
                new InformeRotacionVisualFiltrosResponse(
                        plano == null ? null : plano.getCodigo(),
                        seccion == null ? null : seccion.getId(),
                        seccion == null ? null : seccion.getNombre(),
                        estanteria == null ? null : estanteria.getCodigo()
                ),
                new InformeRotacionVisualResumenResponse(
                        inspecciones.size(),
                        aggregation.totalResultadosSlot,
                        aggregation.totalVacios,
                        aggregation.totalOcupados,
                        aggregation.totalAnomalias
                ),
                productosMasVaciados(aggregation.productosPorSlot),
                slotsMasVaciados(aggregation.slots),
                productosSinVacios(aggregation.productos),
                resumenPorDiaSemana(aggregation.vaciosPorDia)
        );
    }

    private List<Inspeccion> cargarInspeccionesParaInforme(Instant desde,
                                                           Instant hastaExclusiva,
                                                           Long seccionId,
                                                           Estanteria estanteria) {
        // PostgreSQL no infiere bien parametros null dentro de lower(:param), por eso se usan
        // consultas separadas con/sin estanteria y el codigo llega normalizado desde el servicio.
        if (estanteria == null) {
            return inspeccionRepository.findParaInformeRotacionVisual(
                    desde,
                    hastaExclusiva,
                    seccionId
            );
        }
        return inspeccionRepository.findParaInformeRotacionVisualPorEstanteria(
                desde,
                hastaExclusiva,
                seccionId,
                estanteria.getCodigo().toLowerCase(Locale.ROOT)
        );
    }

    private Plano resolverPlano(String planoCodigo) {
        if (planoCodigo == null) {
            return null;
        }
        return planoRepository.findByCodigoIgnoreCase(planoCodigo)
                .orElseThrow(() -> ApiException.notFound(
                        "PLANO_NO_ENCONTRADO",
                        "No se encontro el plano indicado."
                ));
    }

    private Seccion resolverSeccion(Long seccionId) {
        if (seccionId == null) {
            return null;
        }
        return seccionRepository.findById(seccionId)
                .orElseThrow(() -> ApiException.notFound(
                        "SECCION_NO_ENCONTRADA",
                        "No se encontro la seccion indicada."
                ));
    }

    private Estanteria resolverEstanteria(String estanteriaCodigo, Long seccionId) {
        if (estanteriaCodigo == null) {
            return null;
        }
        Estanteria estanteria = estanteriaRepository.findWithSeccionByCodigoIgnoreCase(estanteriaCodigo)
                .orElseThrow(() -> ApiException.notFound(
                        "ESTANTERIA_NO_ENCONTRADA",
                        "No se encontro la estanteria indicada."
                ));
        if (seccionId != null && !Objects.equals(estanteria.getSeccion().getId(), seccionId)) {
            throw ApiException.badRequest(
                    "FILTROS_INCOMPATIBLES",
                    "La estanteria indicada no pertenece a la seccion seleccionada."
            );
        }
        return estanteria;
    }

    private Set<Long> resolverEstanteriasDelPlano(Plano plano) {
        if (plano == null) {
            return null;
        }
        return planoEstanteriaLayoutRepository.findByPlanoIdOrderByIdAsc(plano.getId()).stream()
                .map(PlanoEstanteriaLayout::getEstanteria)
                .filter(Objects::nonNull)
                .map(Estanteria::getId)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private Map<SlotConfigKey, EstanteriaSlotConfiguracion> cargarSlotsConfigurados(List<Inspeccion> inspecciones) {
        List<Long> estanteriaIds = inspecciones.stream()
                .map(Inspeccion::getEstanteria)
                .filter(Objects::nonNull)
                .map(Estanteria::getId)
                .distinct()
                .toList();
        if (estanteriaIds.isEmpty()) {
            return Map.of();
        }
        return slotConfiguracionRepository.findActivosByEstanteriaIdsOrdenados(estanteriaIds).stream()
                .collect(Collectors.toMap(
                        slot -> new SlotConfigKey(slot.getEstanteria().getId(), normalizarSlot(slot.getSlotId())),
                        Function.identity(),
                        (actual, repetido) -> actual
                ));
    }

    private Aggregation agregarResultados(List<Inspeccion> inspecciones,
                                          Map<SlotConfigKey, EstanteriaSlotConfiguracion> slotsConfigurados,
                                          ZoneId zona) {
        Aggregation aggregation = new Aggregation();
        for (DayOfWeek dia : DayOfWeek.values()) {
            aggregation.vaciosPorDia.put(dia, 0);
        }

        for (Inspeccion inspeccion : inspecciones) {
            Estanteria estanteria = inspeccion.getEstanteria();
            if (estanteria == null) {
                continue;
            }
            List<InspeccionSlotResultado> resultadosOrdenados = inspeccion.getSlots().stream()
                    .sorted(Comparator.comparing(
                            InspeccionSlotResultado::getOrden,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    ))
                    .toList();
            for (InspeccionSlotResultado resultado : resultadosOrdenados) {
                EstanteriaSlotConfiguracion slotConfigurado = slotsConfigurados.get(
                        new SlotConfigKey(estanteria.getId(), normalizarSlot(resultado.getSlotId()))
                );
                Producto producto = slotConfigurado == null ? null : slotConfigurado.getProducto();
                String seccionNombre = estanteria.getSeccion() == null ? null : estanteria.getSeccion().getNombre();
                Instant fechaResultado = fechaInspeccion(inspeccion);

                ProductoSlotStats productoSlotStats = aggregation.productosPorSlot.computeIfAbsent(
                        new ProductoSlotKey(producto == null ? null : producto.getId(), estanteria.getCodigo(), resultado.getSlotId()),
                        ignored -> new ProductoSlotStats(producto, seccionNombre, estanteria.getCodigo(), resultado.getSlotId())
                );
                SlotStats slotStats = aggregation.slots.computeIfAbsent(
                        new SlotKey(estanteria.getCodigo(), resultado.getSlotId()),
                        ignored -> new SlotStats(seccionNombre, estanteria.getCodigo(), resultado.getSlotId(), producto)
                );

                ProductoStats productoStats = null;
                if (producto != null) {
                    productoStats = aggregation.productos.computeIfAbsent(
                            producto.getId(),
                            ignored -> new ProductoStats(producto)
                    );
                }

                aggregation.totalResultadosSlot++;
                productoSlotStats.contar(resultado.getEstadoVisual(), fechaResultado);
                slotStats.contar(resultado.getEstadoVisual());
                if (productoStats != null) {
                    productoStats.contar(resultado.getEstadoVisual());
                }

                if (resultado.getEstadoVisual() == EstadoVisualSlot.VACIO) {
                    aggregation.totalVacios++;
                    DayOfWeek dia = fechaResultado.atZone(zona).getDayOfWeek();
                    aggregation.vaciosPorDia.merge(dia, 1, Integer::sum);
                } else if (resultado.getEstadoVisual() == EstadoVisualSlot.OCUPADO) {
                    aggregation.totalOcupados++;
                } else if (resultado.getEstadoVisual() == EstadoVisualSlot.ANOMALIA) {
                    aggregation.totalAnomalias++;
                }
            }
        }
        return aggregation;
    }

    private List<ProductoVaciadoResponse> productosMasVaciados(Map<ProductoSlotKey, ProductoSlotStats> stats) {
        return stats.values().stream()
                .filter(stat -> stat.producto != null)
                .filter(stat -> stat.vacios > 0)
                .sorted(Comparator.comparingInt(ProductoSlotStats::vacios).reversed()
                        .thenComparing(ProductoSlotStats::productoNombre)
                        .thenComparing(ProductoSlotStats::slotId))
                .limit(LIMITE_RANKING)
                .map(ProductoSlotStats::toResponse)
                .toList();
    }

    private List<SlotVaciadoResponse> slotsMasVaciados(Map<SlotKey, SlotStats> stats) {
        return stats.values().stream()
                .filter(stat -> stat.vacios > 0)
                .sorted(Comparator.comparingInt(SlotStats::vacios).reversed()
                        .thenComparing(SlotStats::estanteriaCodigo)
                        .thenComparing(SlotStats::slotId))
                .limit(LIMITE_RANKING)
                .map(SlotStats::toResponse)
                .toList();
    }

    private List<ProductoSinVaciosResponse> productosSinVacios(Map<Long, ProductoStats> stats) {
        return stats.values().stream()
                .filter(stat -> stat.total() > 0)
                .filter(stat -> stat.vacios == 0)
                .sorted(Comparator.comparing(ProductoStats::productoNombre))
                .limit(LIMITE_RANKING)
                .map(ProductoStats::toResponse)
                .toList();
    }

    private List<ResumenDiaSemanaResponse> resumenPorDiaSemana(EnumMap<DayOfWeek, Integer> vaciosPorDia) {
        return List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
                        DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)
                .stream()
                .map(dia -> new ResumenDiaSemanaResponse(nombreDia(dia), vaciosPorDia.getOrDefault(dia, 0)))
                .toList();
    }

    private Instant fechaInspeccion(Inspeccion inspeccion) {
        return inspeccion.getCapturadaEn() != null ? inspeccion.getCapturadaEn() : inspeccion.getCreatedAt();
    }

    private String normalizar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private String normalizarSlot(String slotId) {
        return slotId == null ? "" : slotId.trim().toLowerCase(Locale.ROOT);
    }

    private String nombreDia(DayOfWeek dia) {
        return switch (dia) {
            case MONDAY -> "Lunes";
            case TUESDAY -> "Martes";
            case WEDNESDAY -> "Miercoles";
            case THURSDAY -> "Jueves";
            case FRIDAY -> "Viernes";
            case SATURDAY -> "Sabado";
            case SUNDAY -> "Domingo";
        };
    }

    private static double porcentaje(int parte, int total) {
        if (total == 0) {
            return 0.0;
        }
        return Math.round((parte * 10000.0) / total) / 100.0;
    }

    private record SlotConfigKey(Long estanteriaId, String slotId) {
    }

    private record ProductoSlotKey(Long productoId, String estanteriaCodigo, String slotId) {
    }

    private record SlotKey(String estanteriaCodigo, String slotId) {
    }

    private static final class Aggregation {
        private final Map<ProductoSlotKey, ProductoSlotStats> productosPorSlot = new HashMap<>();
        private final Map<SlotKey, SlotStats> slots = new HashMap<>();
        private final Map<Long, ProductoStats> productos = new HashMap<>();
        private final EnumMap<DayOfWeek, Integer> vaciosPorDia = new EnumMap<>(DayOfWeek.class);
        private int totalResultadosSlot;
        private int totalVacios;
        private int totalOcupados;
        private int totalAnomalias;
    }

    private static class ContadoresVisuales {
        protected int vacios;
        protected int ocupados;
        protected int anomalias;

        protected void contar(EstadoVisualSlot estadoVisual) {
            if (estadoVisual == EstadoVisualSlot.VACIO) {
                vacios++;
            } else if (estadoVisual == EstadoVisualSlot.OCUPADO) {
                ocupados++;
            } else if (estadoVisual == EstadoVisualSlot.ANOMALIA) {
                anomalias++;
            }
        }

        protected int total() {
            return vacios + ocupados + anomalias;
        }
    }

    private static final class ProductoSlotStats extends ContadoresVisuales {
        private final Producto producto;
        private final String seccionNombre;
        private final String estanteriaCodigo;
        private final String slotId;
        private Instant ultimoVacioAt;

        private ProductoSlotStats(Producto producto, String seccionNombre, String estanteriaCodigo, String slotId) {
            this.producto = producto;
            this.seccionNombre = seccionNombre;
            this.estanteriaCodigo = estanteriaCodigo;
            this.slotId = slotId;
        }

        private void contar(EstadoVisualSlot estadoVisual, Instant fechaResultado) {
            super.contar(estadoVisual);
            if (estadoVisual == EstadoVisualSlot.VACIO
                    && (ultimoVacioAt == null || fechaResultado.isAfter(ultimoVacioAt))) {
                ultimoVacioAt = fechaResultado;
            }
        }

        private int vacios() {
            return vacios;
        }

        private String productoNombre() {
            return producto == null ? "" : producto.getNombre();
        }

        private String slotId() {
            return slotId;
        }

        private ProductoVaciadoResponse toResponse() {
            return new ProductoVaciadoResponse(
                    producto.getId(),
                    producto.getCodigoInterno(),
                    producto.getNombre(),
                    seccionNombre,
                    estanteriaCodigo,
                    slotId,
                    vacios,
                    ocupados,
                    anomalias,
                    total(),
                    porcentaje(vacios, total()),
                    ultimoVacioAt
            );
        }
    }

    private static final class SlotStats extends ContadoresVisuales {
        private final String seccionNombre;
        private final String estanteriaCodigo;
        private final String slotId;
        private final Producto productoEsperado;

        private SlotStats(String seccionNombre, String estanteriaCodigo, String slotId, Producto productoEsperado) {
            this.seccionNombre = seccionNombre;
            this.estanteriaCodigo = estanteriaCodigo;
            this.slotId = slotId;
            this.productoEsperado = productoEsperado;
        }

        private int vacios() {
            return vacios;
        }

        private String estanteriaCodigo() {
            return estanteriaCodigo;
        }

        private String slotId() {
            return slotId;
        }

        private SlotVaciadoResponse toResponse() {
            return new SlotVaciadoResponse(
                    seccionNombre,
                    estanteriaCodigo,
                    slotId,
                    productoEsperado == null ? "Sin producto esperado" : productoEsperado.getNombre(),
                    vacios,
                    total(),
                    porcentaje(vacios, total())
            );
        }
    }

    private static final class ProductoStats extends ContadoresVisuales {
        private final Producto producto;

        private ProductoStats(Producto producto) {
            this.producto = producto;
        }

        private String productoNombre() {
            return producto.getNombre();
        }

        private ProductoSinVaciosResponse toResponse() {
            return new ProductoSinVaciosResponse(
                    producto.getId(),
                    producto.getCodigoInterno(),
                    producto.getNombre(),
                    total(),
                    vacios
            );
        }
    }
}
