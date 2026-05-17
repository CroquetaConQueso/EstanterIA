package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import com.proyectofincurso.estanteria.persistence.entity.Proveedor;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.TrabajadorEstanteria;
import com.proyectofincurso.estanteria.persistence.repository.AlertaRepository;
import com.proyectofincurso.estanteria.persistence.repository.AlertaTrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorEstanteriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlertaOperativaServiceTest {

    @Mock
    private InspeccionRepository inspeccionRepository;
    @Mock
    private EstanteriaRepository estanteriaRepository;
    @Mock
    private EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    @Mock
    private AsignacionProductoSlotRepository asignacionProductoSlotRepository;
    @Mock
    private SeccionEncargadoRepository seccionEncargadoRepository;
    @Mock
    private TrabajadorEstanteriaRepository trabajadorEstanteriaRepository;
    @Mock
    private AlertaRepository alertaRepository;
    @Mock
    private AlertaTrabajadorRepository alertaTrabajadorRepository;
    @Mock
    private TareaOperativaService tareaOperativaService;

    @InjectMocks
    private AlertaOperativaService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "diasUmbralCaducidad", 7);
    }

    @Test
    void asignacionConCaducidadDentroDelMargenGeneraAlerta() {
        AsignacionProductoSlot asignacion = asignacionBase();
        asignacion.setFechaCaducidad(LocalDate.now().plusDays(3));
        when(asignacionProductoSlotRepository.findActivaConContextoById(1L, EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(Optional.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR,
                EstadoAlerta.ABIERTA,
                1L,
                60L
        )).thenReturn(List.of());
        when(seccionEncargadoRepository.findEncargadosActivosBySeccionId(10L)).thenReturn(List.of());

        var response = service.evaluarAsignacionActiva(1L);

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());
        Alerta alerta = captor.getValue();
        assertThat(alerta.getTipoAlerta()).isEqualTo(TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR);
        assertThat(alerta.getPrioridad()).isEqualTo(PrioridadAlerta.MEDIA);
        assertThat(alerta.getAsignacionProductoSlot()).isEqualTo(asignacion);
        assertThat(alerta.getSlotConfiguracion()).isEqualTo(asignacion.getSlotConfiguracion());
        assertThat(response.alertasCreadas()).isEqualTo(1);
    }

    @Test
    void caducidadHoyGeneraAlertaAltaDeProximaCaducidad() {
        AsignacionProductoSlot asignacion = asignacionBase();
        asignacion.setFechaCaducidad(LocalDate.now());
        when(asignacionProductoSlotRepository.findActivaConContextoById(1L, EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(Optional.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR,
                EstadoAlerta.ABIERTA,
                1L,
                60L
        )).thenReturn(List.of());
        when(seccionEncargadoRepository.findEncargadosActivosBySeccionId(10L)).thenReturn(List.of());

        service.evaluarAsignacionActiva(1L);

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());
        assertThat(captor.getValue().getPrioridad()).isEqualTo(PrioridadAlerta.ALTA);
    }

    @Test
    void caducidadVencidaNoGeneraAlertaDeProximaCaducidad() {
        AsignacionProductoSlot asignacion = asignacionBase();
        asignacion.setFechaCaducidad(LocalDate.now().minusDays(1));
        when(asignacionProductoSlotRepository.findActivaConContextoById(1L, EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(Optional.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE,
                EstadoAlerta.ABIERTA,
                1L,
                60L
        )).thenReturn(List.of());
        when(seccionEncargadoRepository.findEncargadosActivosBySeccionId(10L)).thenReturn(List.of());

        service.evaluarAsignacionActiva(1L);

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());
        assertThat(captor.getValue().getTipoAlerta()).isEqualTo(TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE);
        assertThat(captor.getValue().getMensaje()).contains("ya esta caducado y debe retirarse");
    }

    @Test
    void noDuplicaAlertaAbiertaDeCaducidad() {
        AsignacionProductoSlot asignacion = asignacionBase();
        asignacion.setFechaCaducidad(LocalDate.now().plusDays(2));
        Alerta existente = new Alerta();
        existente.setId(99L);
        existente.setTipoAlerta(TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR);
        when(asignacionProductoSlotRepository.findActivaConContextoById(1L, EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(Optional.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR,
                EstadoAlerta.ABIERTA,
                1L,
                60L
        )).thenReturn(List.of(existente));

        var response = service.evaluarAsignacionActiva(1L);

        verify(alertaRepository, never()).save(any(Alerta.class));
        assertThat(response.alertasExistentes()).isEqualTo(1);
    }

    @Test
    void retiradaProgramadaVencidaGeneraAlerta() {
        AsignacionProductoSlot asignacion = asignacionBase();
        asignacion.setFechaRetiradaProgramada(LocalDate.now().minusDays(1));
        when(asignacionProductoSlotRepository.findActivaConContextoById(1L, EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(Optional.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE,
                EstadoAlerta.ABIERTA,
                1L,
                60L
        )).thenReturn(List.of());
        when(seccionEncargadoRepository.findEncargadosActivosBySeccionId(10L)).thenReturn(List.of());

        service.evaluarAsignacionActiva(1L);

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());
        assertThat(captor.getValue().getTipoAlerta()).isEqualTo(TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE);
        assertThat(captor.getValue().getPrioridad()).isEqualTo(PrioridadAlerta.ALTA);
    }

    @Test
    void revisionManualEvaluaCaducidadYRetiradaDeAsignacionesActivas() {
        AsignacionProductoSlot asignacion = asignacionBase();
        asignacion.setFechaCaducidad(LocalDate.now().minusDays(1));
        asignacion.setFechaRetiradaProgramada(LocalDate.now().minusDays(1));
        when(asignacionProductoSlotRepository.findActivasConContexto(EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(List.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE,
                EstadoAlerta.ABIERTA,
                1L,
                60L
        )).thenReturn(List.of());
        when(seccionEncargadoRepository.findEncargadosActivosBySeccionId(10L)).thenReturn(List.of());

        var response = service.revisarCaducidades();

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());
        assertThat(captor.getValue().getTipoAlerta()).isEqualTo(TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE);
        assertThat(response.asignacionesRevisadas()).isEqualTo(1);
        assertThat(response.alertasCreadas()).isEqualTo(1);
        assertThat(response.alertasExistentes()).isZero();
    }

    @Test
    void revisionManualCuentaAlertaExistenteSinDuplicar() {
        AsignacionProductoSlot asignacion = asignacionBase();
        asignacion.setFechaCaducidad(LocalDate.now().plusDays(2));
        Alerta existente = new Alerta();
        existente.setId(88L);
        existente.setTipoAlerta(TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR);
        when(asignacionProductoSlotRepository.findActivasConContexto(EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(List.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorAsignacionYSlot(
                TipoAlerta.PRODUCTO_PROXIMO_A_CADUCAR,
                EstadoAlerta.ABIERTA,
                1L,
                60L
        )).thenReturn(List.of(existente));

        var response = service.revisarCaducidades();

        verify(alertaRepository, never()).save(any(Alerta.class));
        assertThat(response.asignacionesRevisadas()).isEqualTo(1);
        assertThat(response.alertasCreadas()).isZero();
        assertThat(response.alertasExistentes()).isEqualTo(1);
    }

    @Test
    void revisionManualRevisaTodasLasAsignacionesActivasSinGenerarSiNoHayFechas() {
        AsignacionProductoSlot asignacionSinFechas = asignacionBase();
        when(asignacionProductoSlotRepository.findActivasConContexto(EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(List.of(asignacionSinFechas));

        var response = service.revisarCaducidades();

        verify(alertaRepository, never()).save(any(Alerta.class));
        assertThat(response.asignacionesRevisadas()).isEqualTo(1);
        assertThat(response.alertasCreadas()).isZero();
        assertThat(response.alertasExistentes()).isZero();
    }

    @Test
    void alertaSinAsignacionVinculadaNoExponeStockDeAsignacionActivaDelSlot() {
        AsignacionProductoSlot asignacion = asignacionBase();
        Alerta alerta = new Alerta();
        alerta.setId(77L);
        alerta.setTipoAlerta(TipoAlerta.ANOMALIA_VISUAL);
        alerta.setPrioridad(PrioridadAlerta.ALTA);
        alerta.setEstadoAlerta(EstadoAlerta.ABIERTA);
        alerta.setMensaje("Anomalia visual");
        alerta.setCreatedAt(java.time.Instant.now());
        alerta.setSeccion(asignacion.getSlotConfiguracion().getEstanteria().getSeccion());
        alerta.setEstanteria(asignacion.getSlotConfiguracion().getEstanteria());
        alerta.setSlotConfiguracion(asignacion.getSlotConfiguracion());
        when(alertaRepository.findAlertasConContextoByEstado(EstadoAlerta.ABIERTA)).thenReturn(List.of(alerta));

        var response = service.obtenerAlertasAbiertas();

        assertThat(response).hasSize(1);
        assertThat(response.get(0).asignacion()).isNull();
        assertThat(response.get(0).proveedorNombre()).isNull();
        assertThat(response.get(0).stockDisponible()).isNull();
        assertThat(response.get(0).stockMensaje()).isEqualTo("Sin dato de stock");
        verify(asignacionProductoSlotRepository, never()).findAsignacionActivaDeSlot(any(), any());
    }

    @Test
    void siNoHayAsignacionActivaNoGeneraAlerta() {
        when(asignacionProductoSlotRepository.findActivaConContextoById(1L, EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(Optional.empty());

        var response = service.evaluarAsignacionActiva(1L);

        verify(alertaRepository, never()).save(any(Alerta.class));
        assertThat(response.asignacionesEvaluadas()).isZero();
    }

    @Test
    void asignacionRetiradaNoGeneraAlertasComoActiva() {
        when(asignacionProductoSlotRepository.findActivaConContextoById(1L, EstadoAsignacionProductoSlot.ACTIVA))
                .thenReturn(Optional.empty());

        var response = service.evaluarAsignacionActiva(1L);

        verify(alertaRepository, never()).save(any(Alerta.class));
        assertThat(response.alertasCreadas()).isZero();
        assertThat(response.asignacionesEvaluadas()).isZero();
    }

    @Test
    void trabajadorEnfermoAsignadoGeneraAlertaDeEstanteria() {
        TrabajadorEstanteria asignacion = asignacionTrabajadorEstanteria(EstadoDisponibilidadTrabajador.ENFERMO);
        when(trabajadorEstanteriaRepository.findActivasConTrabajadorNoDisponible(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorEstanteria(
                TipoAlerta.TRABAJADOR_NO_DISPONIBLE_ASIGNADO,
                EstadoAlerta.ABIERTA,
                20L
        )).thenReturn(List.of());
        when(seccionEncargadoRepository.findEncargadosActivosBySeccionId(10L)).thenReturn(List.of());

        var response = service.revisarTrabajadoresNoDisponiblesAsignados();

        ArgumentCaptor<Alerta> captor = ArgumentCaptor.forClass(Alerta.class);
        verify(alertaRepository).save(captor.capture());
        Alerta alerta = captor.getValue();
        assertThat(alerta.getTipoAlerta()).isEqualTo(TipoAlerta.TRABAJADOR_NO_DISPONIBLE_ASIGNADO);
        assertThat(alerta.getPrioridad()).isEqualTo(PrioridadAlerta.ALTA);
        assertThat(alerta.getEstanteria()).isEqualTo(asignacion.getEstanteria());
        assertThat(alerta.getSlotConfiguracion()).isNull();
        assertThat(alerta.getMensaje()).contains("EST-001", "Mario", "ENFERMO");
        assertThat(response.asignacionesRevisadas()).isEqualTo(1);
        assertThat(response.estanteriasAfectadas()).isEqualTo(1);
        assertThat(response.alertasCreadas()).isEqualTo(1);
    }

    @Test
    void noDuplicaAlertaAbiertaDeTrabajadorNoDisponible() {
        TrabajadorEstanteria asignacion = asignacionTrabajadorEstanteria(EstadoDisponibilidadTrabajador.AUSENTE);
        Alerta existente = new Alerta();
        existente.setId(12L);
        existente.setTipoAlerta(TipoAlerta.TRABAJADOR_NO_DISPONIBLE_ASIGNADO);
        when(trabajadorEstanteriaRepository.findActivasConTrabajadorNoDisponible(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(asignacion));
        when(alertaRepository.findAlertasAbiertasPorEstanteria(
                TipoAlerta.TRABAJADOR_NO_DISPONIBLE_ASIGNADO,
                EstadoAlerta.ABIERTA,
                20L
        )).thenReturn(List.of(existente));

        var response = service.revisarTrabajadoresNoDisponiblesAsignados();

        verify(alertaRepository, never()).save(any(Alerta.class));
        assertThat(response.alertasCreadas()).isZero();
        assertThat(response.alertasExistentes()).isEqualTo(1);
    }

    @Test
    void sinTrabajadoresNoDisponiblesAsignadosNoGeneraAlertas() {
        when(trabajadorEstanteriaRepository.findActivasConTrabajadorNoDisponible(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of());

        var response = service.revisarTrabajadoresNoDisponiblesAsignados();

        verify(alertaRepository, never()).save(any(Alerta.class));
        assertThat(response.asignacionesRevisadas()).isZero();
        assertThat(response.estanteriasAfectadas()).isZero();
        assertThat(response.alertasCreadas()).isZero();
        assertThat(response.alertasExistentes()).isZero();
    }

    private AsignacionProductoSlot asignacionBase() {
        Seccion seccion = new Seccion();
        seccion.setId(10L);
        seccion.setCodigo("SEC-DEMO");
        seccion.setNombre("Seccion demo");

        Estanteria estanteria = new Estanteria();
        estanteria.setId(20L);
        estanteria.setCodigo("EST-001");
        estanteria.setNombre("Estanteria demo");
        estanteria.setSeccion(seccion);

        Producto producto = new Producto();
        producto.setId(30L);
        producto.setCodigoInterno("PROD-ARROZ");
        producto.setNombre("Arroz");

        Proveedor proveedor = new Proveedor();
        proveedor.setId(40L);
        proveedor.setNombre("Proveedor demo");

        ProductoProveedor productoProveedor = new ProductoProveedor();
        productoProveedor.setId(50L);
        productoProveedor.setProducto(producto);
        productoProveedor.setProveedor(proveedor);

        EstanteriaSlotConfiguracion slot = new EstanteriaSlotConfiguracion();
        slot.setId(60L);
        slot.setSlotId("slot_2");
        slot.setEstanteria(estanteria);

        AsignacionProductoSlot asignacion = new AsignacionProductoSlot();
        asignacion.setId(1L);
        asignacion.setSlotConfiguracion(slot);
        asignacion.setProductoProveedor(productoProveedor);
        asignacion.setEstadoAsignacion(EstadoAsignacionProductoSlot.ACTIVA);
        return asignacion;
    }

    private TrabajadorEstanteria asignacionTrabajadorEstanteria(EstadoDisponibilidadTrabajador disponibilidad) {
        Seccion seccion = new Seccion();
        seccion.setId(10L);
        seccion.setCodigo("SEC-DEMO");
        seccion.setNombre("Seccion demo");

        Estanteria estanteria = new Estanteria();
        estanteria.setId(20L);
        estanteria.setCodigo("EST-001");
        estanteria.setNombre("Estanteria demo");
        estanteria.setSeccion(seccion);
        estanteria.setActiva(true);

        Trabajador trabajador = new Trabajador();
        trabajador.setId(30L);
        trabajador.setNombre("Mario");
        trabajador.setApellidos("Lopez");
        trabajador.setTipoTrabajador(TipoTrabajador.TRABAJADOR);
        trabajador.setEstadoDisponibilidad(disponibilidad);
        trabajador.setActivo(true);

        TrabajadorEstanteria asignacion = new TrabajadorEstanteria();
        asignacion.setId(40L);
        asignacion.setTrabajador(trabajador);
        asignacion.setEstanteria(estanteria);
        asignacion.setActiva(true);
        return asignacion;
    }
}
