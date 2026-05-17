package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.EstadoVisualSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.entity.InspeccionSlotResultado;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.InspeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoEstanteriaLayoutRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InformeRotacionVisualServiceTest {

    @Mock
    private InspeccionRepository inspeccionRepository;
    @Mock
    private EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    @Mock
    private PlanoRepository planoRepository;
    @Mock
    private PlanoEstanteriaLayoutRepository planoEstanteriaLayoutRepository;
    @Mock
    private SeccionRepository seccionRepository;
    @Mock
    private EstanteriaRepository estanteriaRepository;

    @InjectMocks
    private InformeRotacionVisualService service;

    @Test
    void informeVacioCuandoNoHayInspeccionesEnPeriodo() {
        when(inspeccionRepository.findParaInformeRotacionVisual(any(Instant.class), any(Instant.class), isNull(), isNull()))
                .thenReturn(List.of());

        var response = service.generarInforme(null, null, null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 17));

        assertThat(response.resumen().totalInspecciones()).isZero();
        assertThat(response.resumen().totalResultadosSlot()).isZero();
        assertThat(response.productosMasVaciados()).isEmpty();
        assertThat(response.slotsMasVaciados()).isEmpty();
        assertThat(response.productosSinVacios()).isEmpty();
        assertThat(response.resumenPorDiaSemana()).hasSize(7);
    }

    @Test
    void productoConVariosVaciosApareceEnProductosMasVaciados() {
        Inspeccion inspeccion = inspeccionConResultado(EstadoVisualSlot.VACIO, Instant.parse("2026-05-13T10:00:00Z"));
        EstanteriaSlotConfiguracion slot = slotConfigurado(inspeccion.getEstanteria(), productoArroz());
        when(inspeccionRepository.findParaInformeRotacionVisual(any(Instant.class), any(Instant.class), isNull(), isNull()))
                .thenReturn(List.of(inspeccion));
        when(slotConfiguracionRepository.findActivosByEstanteriaIdsOrdenados(anyCollection()))
                .thenReturn(List.of(slot));

        var response = service.generarInforme(null, null, null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 17));

        assertThat(response.resumen().totalVaciosDetectados()).isEqualTo(1);
        assertThat(response.productosMasVaciados()).hasSize(1);
        assertThat(response.productosMasVaciados().get(0).productoNombre()).isEqualTo("Arroz");
        assertThat(response.productosMasVaciados().get(0).porcentajeVacio()).isEqualTo(100.0);
        assertThat(response.resumenPorDiaSemana())
                .anySatisfy(dia -> {
                    assertThat(dia.diaSemana()).isEqualTo("Miercoles");
                    assertThat(dia.vaciosDetectados()).isEqualTo(1);
                });
    }

    @Test
    void productoInspeccionadoSinVaciosApareceEnProductosSinVacios() {
        Inspeccion inspeccion = inspeccionConResultado(EstadoVisualSlot.OCUPADO, Instant.parse("2026-05-14T10:00:00Z"));
        EstanteriaSlotConfiguracion slot = slotConfigurado(inspeccion.getEstanteria(), productoArroz());
        when(inspeccionRepository.findParaInformeRotacionVisual(any(Instant.class), any(Instant.class), isNull(), isNull()))
                .thenReturn(List.of(inspeccion));
        when(slotConfiguracionRepository.findActivosByEstanteriaIdsOrdenados(anyCollection()))
                .thenReturn(List.of(slot));

        var response = service.generarInforme(null, null, null, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 17));

        assertThat(response.productosMasVaciados()).isEmpty();
        assertThat(response.productosSinVacios()).hasSize(1);
        assertThat(response.productosSinVacios().get(0).productoNombre()).isEqualTo("Arroz");
        assertThat(response.productosSinVacios().get(0).vaciosDetectados()).isZero();
    }

    @Test
    void fechaDesdePosteriorAFechaHastaDevuelveBadRequest() {
        assertThatThrownBy(() -> service.generarInforme(null, null, null, LocalDate.of(2026, 5, 18), LocalDate.of(2026, 5, 17)))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(apiException.getCode()).isEqualTo("INFORME_FECHAS_INVALIDAS");
                });
        verify(inspeccionRepository, never()).findParaInformeRotacionVisual(any(), any(), any(), any());
    }

    private Inspeccion inspeccionConResultado(EstadoVisualSlot estadoVisual, Instant fecha) {
        Estanteria estanteria = estanteriaDemo();
        Inspeccion inspeccion = new Inspeccion();
        inspeccion.setId(1L);
        inspeccion.setEstanteria(estanteria);
        inspeccion.setEstanteriaCodigo(estanteria.getCodigo());
        inspeccion.setCreatedAt(fecha);
        inspeccion.setCapturadaEn(fecha);

        InspeccionSlotResultado resultado = new InspeccionSlotResultado();
        resultado.setId(10L);
        resultado.setInspeccion(inspeccion);
        resultado.setSlotId("slot_2");
        resultado.setOrden(2);
        resultado.setEstadoVisual(estadoVisual);
        resultado.setConfianza(0.95);
        inspeccion.getSlots().add(resultado);
        return inspeccion;
    }

    private EstanteriaSlotConfiguracion slotConfigurado(Estanteria estanteria, Producto producto) {
        EstanteriaSlotConfiguracion slot = new EstanteriaSlotConfiguracion();
        slot.setId(20L);
        slot.setEstanteria(estanteria);
        slot.setProducto(producto);
        slot.setSlotId("slot_2");
        slot.setOrden(2);
        slot.setActivo(true);
        return slot;
    }

    private Producto productoArroz() {
        Producto producto = new Producto();
        producto.setId(30L);
        producto.setCodigoInterno("PROD-ARROZ");
        producto.setNombre("Arroz");
        producto.setActivo(true);
        return producto;
    }

    private Estanteria estanteriaDemo() {
        Seccion seccion = new Seccion();
        seccion.setId(40L);
        seccion.setNombre("Despensa");

        Estanteria estanteria = new Estanteria();
        estanteria.setId(50L);
        estanteria.setCodigo("EST-001");
        estanteria.setNombre("Estanteria demo");
        estanteria.setSeccion(seccion);
        estanteria.setActiva(true);
        return estanteria;
    }
}
