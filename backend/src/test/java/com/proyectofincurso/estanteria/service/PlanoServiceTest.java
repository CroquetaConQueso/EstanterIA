package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.Plano;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoEstanteriaLayoutRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoRepository;
import com.proyectofincurso.estanteria.persistence.repository.PlanoZonaRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.web.dto.EstadoListadoPlanos;
import com.proyectofincurso.estanteria.web.error.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanoServiceTest {

    @Mock
    private PlanoRepository planoRepository;
    @Mock
    private PlanoZonaRepository planoZonaRepository;
    @Mock
    private PlanoEstanteriaLayoutRepository planoEstanteriaLayoutRepository;
    @Mock
    private EmpresaRepository empresaRepository;
    @Mock
    private SeccionRepository seccionRepository;
    @Mock
    private EstanteriaRepository estanteriaRepository;

    @InjectMocks
    private PlanoService service;

    @Test
    void listadoSinEstadoDevuelveSoloActivos() {
        Empresa empresa = empresa();
        Plano activo = plano("PLANO-A", true, empresa);
        when(empresaRepository.findByCodigoAndActivaTrue("EMP-DEMO")).thenReturn(Optional.of(empresa));
        when(planoRepository.findByEmpresaCodigoAndActivoTrueOrderByNombreAsc("EMP-DEMO")).thenReturn(List.of(activo));

        var response = service.listarPlanosDeEmpresa("EMP-DEMO", null);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).codigo()).isEqualTo("PLANO-A");
        assertThat(response.get(0).activo()).isTrue();
    }

    @Test
    void listadoInactivosDevuelveSoloInactivos() {
        Empresa empresa = empresa();
        Plano inactivo = plano("PLANO-I", false, empresa);
        when(empresaRepository.findByCodigoAndActivaTrue("EMP-DEMO")).thenReturn(Optional.of(empresa));
        when(planoRepository.findByEmpresaCodigoAndActivoFalseOrderByNombreAsc("EMP-DEMO")).thenReturn(List.of(inactivo));

        var response = service.listarPlanosDeEmpresa("EMP-DEMO", EstadoListadoPlanos.INACTIVOS);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).codigo()).isEqualTo("PLANO-I");
        assertThat(response.get(0).activo()).isFalse();
    }

    @Test
    void listadoTodosDevuelveActivosEInactivos() {
        Empresa empresa = empresa();
        Plano activo = plano("PLANO-A", true, empresa);
        Plano inactivo = plano("PLANO-I", false, empresa);
        when(empresaRepository.findByCodigoAndActivaTrue("EMP-DEMO")).thenReturn(Optional.of(empresa));
        when(planoRepository.findByEmpresaCodigoOrderByNombreAsc("EMP-DEMO")).thenReturn(List.of(activo, inactivo));

        var response = service.listarPlanosDeEmpresa("EMP-DEMO", EstadoListadoPlanos.TODOS);

        assertThat(response).extracting("codigo").containsExactly("PLANO-A", "PLANO-I");
    }

    @Test
    void desactivarPlanoMarcaActivoFalseSinBorrarContenido() {
        Empresa empresa = empresa();
        Plano plano = plano("PLANO-A", true, empresa);
        when(planoRepository.findWithEmpresaByCodigo("PLANO-A")).thenReturn(Optional.of(plano));
        when(planoRepository.save(any(Plano.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(planoZonaRepository.findByPlanoIdOrderByIdAsc(plano.getId())).thenReturn(List.of());
        when(planoEstanteriaLayoutRepository.findByPlanoIdOrderByIdAsc(plano.getId())).thenReturn(List.of());

        var response = service.desactivarPlano("PLANO-A");

        assertThat(response.activo()).isFalse();
        verify(planoZonaRepository).findByPlanoIdOrderByIdAsc(plano.getId());
        verify(planoEstanteriaLayoutRepository).findByPlanoIdOrderByIdAsc(plano.getId());
    }

    @Test
    void reactivarPlanoMarcaActivoTrue() {
        Empresa empresa = empresa();
        Plano plano = plano("PLANO-I", false, empresa);
        when(planoRepository.findWithEmpresaByCodigo("PLANO-I")).thenReturn(Optional.of(plano));
        when(planoRepository.save(any(Plano.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(planoZonaRepository.findByPlanoIdOrderByIdAsc(plano.getId())).thenReturn(List.of());
        when(planoEstanteriaLayoutRepository.findByPlanoIdOrderByIdAsc(plano.getId())).thenReturn(List.of());

        var response = service.reactivarPlano("PLANO-I");

        assertThat(response.activo()).isTrue();
    }

    @Test
    void desactivarPlanoInexistenteDevuelveNotFound() {
        when(planoRepository.findWithEmpresaByCodigo("NO-EXISTE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.desactivarPlano("NO-EXISTE"))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    private Empresa empresa() {
        Empresa empresa = new Empresa();
        empresa.setId(1L);
        empresa.setCodigo("EMP-DEMO");
        empresa.setNombre("Empresa demo");
        empresa.setActiva(true);
        return empresa;
    }

    private Plano plano(String codigo, boolean activo, Empresa empresa) {
        Plano plano = new Plano();
        plano.setId((long) Math.abs(codigo.hashCode()));
        plano.setEmpresa(empresa);
        plano.setCodigo(codigo);
        plano.setNombre(codigo);
        plano.setDescripcion(null);
        plano.setAncho(1200.0);
        plano.setAlto(800.0);
        plano.setActivo(activo);
        plano.setCreatedAt(Instant.parse("2026-05-01T10:00:00Z"));
        plano.setUpdatedAt(Instant.parse("2026-05-01T10:00:00Z"));
        return plano;
    }
}
