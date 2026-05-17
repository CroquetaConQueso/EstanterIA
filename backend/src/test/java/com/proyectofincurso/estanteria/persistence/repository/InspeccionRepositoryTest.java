package com.proyectofincurso.estanteria.persistence.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoGeneralVisual;
import com.proyectofincurso.estanteria.persistence.entity.EstadoVisualSlot;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaEstado;
import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import com.proyectofincurso.estanteria.persistence.entity.InspeccionSlotResultado;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InspeccionRepositoryTest {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private InspeccionRepository inspeccionRepository;

    @Test
    void ultimaInspeccionConSlotsIgnoraManualPosteriorSinResultados() {
        Estanteria estanteria = crearEstanteria("EST-TEST-01");
        Inspeccion visual = crearInspeccion(estanteria, Instant.parse("2026-05-16T10:00:00Z"), EstadoGeneralVisual.MIXTO);
        crearSlot(visual, "slot_1", 1, EstadoVisualSlot.OCUPADO);
        crearInspeccion(estanteria, Instant.parse("2026-05-16T11:00:00Z"), null);
        entityManager.flush();
        entityManager.clear();

        List<Inspeccion> resultado = inspeccionRepository.findUltimasConSlotsByEstanteriaId(
                estanteria.getId(),
                PageRequest.of(0, 1)
        );

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getId()).isEqualTo(visual.getId());
        assertThat(resultado.get(0).getSlots()).hasSize(1);
    }

    @Test
    void ultimaInspeccionConSlotsDevuelveVacioSiSoloHayManual() {
        Estanteria estanteria = crearEstanteria("EST-TEST-02");
        crearInspeccion(estanteria, Instant.parse("2026-05-16T11:00:00Z"), null);
        entityManager.flush();
        entityManager.clear();

        List<Inspeccion> resultado = inspeccionRepository.findUltimasConSlotsByEstanteriaId(
                estanteria.getId(),
                PageRequest.of(0, 1)
        );

        assertThat(resultado).isEmpty();
    }

    @Test
    void ultimaInspeccionConSlotsUsaCapturadaEnMasReciente() {
        Estanteria estanteria = crearEstanteria("EST-TEST-03");
        Inspeccion anterior = crearInspeccion(estanteria, Instant.parse("2026-05-16T10:00:00Z"), EstadoGeneralVisual.OK);
        crearSlot(anterior, "slot_1", 1, EstadoVisualSlot.OCUPADO);
        Inspeccion reciente = crearInspeccion(estanteria, Instant.parse("2026-05-16T12:00:00Z"), EstadoGeneralVisual.HUECOS_VACIOS);
        crearSlot(reciente, "slot_1", 1, EstadoVisualSlot.VACIO);
        entityManager.flush();
        entityManager.clear();

        List<Inspeccion> resultado = inspeccionRepository.findUltimasConSlotsByEstanteriaId(
                estanteria.getId(),
                PageRequest.of(0, 1)
        );

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getId()).isEqualTo(reciente.getId());
    }

    @Test
    void informeRotacionVisualSinEstanteriaCargaInspeccionesConSlots() {
        Estanteria estanteria = crearEstanteria("EST-TEST-04");
        Inspeccion visual = crearInspeccion(estanteria, Instant.parse("2026-05-16T10:00:00Z"), EstadoGeneralVisual.MIXTO);
        crearSlot(visual, "slot_1", 1, EstadoVisualSlot.OCUPADO);
        crearSlot(visual, "slot_2", 2, EstadoVisualSlot.VACIO);
        entityManager.flush();
        entityManager.clear();

        List<Inspeccion> resultado = inspeccionRepository.findParaInformeRotacionVisual(
                Instant.parse("2026-05-16T00:00:00Z"),
                Instant.parse("2026-05-17T00:00:00Z"),
                null
        );

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getId()).isEqualTo(visual.getId());
        assertThat(resultado.get(0).getSlots()).hasSize(2);
    }

    @Test
    void informeRotacionVisualConEstanteriaFiltraPorCodigoYCargaSlots() {
        Estanteria estanteria = crearEstanteria("EST-TEST-05");
        Inspeccion visual = crearInspeccion(estanteria, Instant.parse("2026-05-16T10:00:00Z"), EstadoGeneralVisual.MIXTO);
        crearSlot(visual, "slot_1", 1, EstadoVisualSlot.OCUPADO);
        Estanteria otraEstanteria = crearEstanteria("EST-TEST-06");
        Inspeccion otraVisual = crearInspeccion(otraEstanteria, Instant.parse("2026-05-16T10:30:00Z"), EstadoGeneralVisual.HUECOS_VACIOS);
        crearSlot(otraVisual, "slot_1", 1, EstadoVisualSlot.VACIO);
        entityManager.flush();
        entityManager.clear();

        List<Inspeccion> resultado = inspeccionRepository.findParaInformeRotacionVisualPorEstanteria(
                Instant.parse("2026-05-16T00:00:00Z"),
                Instant.parse("2026-05-17T00:00:00Z"),
                null,
                "est-test-05"
        );

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getId()).isEqualTo(visual.getId());
        assertThat(resultado.get(0).getSlots()).hasSize(1);
    }

    private Estanteria crearEstanteria(String codigo) {
        Instant now = Instant.parse("2026-05-16T09:00:00Z");

        Empresa empresa = new Empresa();
        empresa.setCodigo("EMP-" + codigo);
        empresa.setNombre("Empresa " + codigo);
        empresa.setActiva(true);
        empresa.setCreatedAt(now);
        empresa.setUpdatedAt(now);
        entityManager.persist(empresa);

        Seccion seccion = new Seccion();
        seccion.setEmpresa(empresa);
        seccion.setCodigo("SEC-" + codigo);
        seccion.setNombre("Seccion " + codigo);
        seccion.setActiva(true);
        seccion.setCreatedAt(now);
        seccion.setUpdatedAt(now);
        entityManager.persist(seccion);

        Estanteria estanteria = new Estanteria();
        estanteria.setSeccion(seccion);
        estanteria.setCodigo(codigo);
        estanteria.setNombre("Estanteria " + codigo);
        estanteria.setActiva(true);
        estanteria.setCreatedAt(now);
        estanteria.setUpdatedAt(now);
        entityManager.persist(estanteria);

        return estanteria;
    }

    private Inspeccion crearInspeccion(Estanteria estanteria, Instant capturadaEn, EstadoGeneralVisual estadoGeneral) {
        Inspeccion inspeccion = new Inspeccion();
        inspeccion.setEstanteria(estanteria);
        inspeccion.setEstanteriaCodigo(estanteria.getCodigo());
        inspeccion.setEstado(EstanteriaEstado.CREADA);
        inspeccion.setCreatedAt(capturadaEn.plusSeconds(30));
        inspeccion.setCapturadaEn(capturadaEn);
        inspeccion.setEstadoGeneralVisual(estadoGeneral);
        entityManager.persist(inspeccion);
        return inspeccion;
    }

    private void crearSlot(Inspeccion inspeccion, String slotId, int orden, EstadoVisualSlot estadoVisual) {
        InspeccionSlotResultado slot = new InspeccionSlotResultado();
        slot.setInspeccion(inspeccion);
        slot.setSlotId(slotId);
        slot.setOrden(orden);
        slot.setEstadoVisual(estadoVisual);
        slot.setConfianza(0.95);
        inspeccion.getSlots().add(slot);
        entityManager.persist(slot);
    }
}
