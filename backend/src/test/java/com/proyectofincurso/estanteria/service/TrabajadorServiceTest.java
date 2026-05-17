package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorEstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.web.dto.ActualizarTrabajadorRequest;
import com.proyectofincurso.estanteria.web.dto.CrearTrabajadorRequest;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrabajadorServiceTest {

    @Mock
    private TrabajadorRepository trabajadorRepository;
    @Mock
    private EmpresaRepository empresaRepository;
    @Mock
    private TrabajadorEstanteriaRepository trabajadorEstanteriaRepository;
    @Mock
    private TareaOperativaRepository tareaOperativaRepository;

    @InjectMocks
    private TrabajadorService service;

    @Test
    void crearTrabajadorConEmailDuplicadoDevuelveConflicto() {
        CrearTrabajadorRequest request = crearRequest("laura@example.com", "600111222");
        when(empresaRepository.findByCodigoAndActivaTrue("EMP-DEMO")).thenReturn(Optional.of(empresaDemo()));
        when(trabajadorRepository.existsByEmailContactoIgnoreCase("laura@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.crearTrabajador(request))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiException.getCode()).isEqualTo("TRABAJADOR_EMAIL_DUPLICADO");
                    assertThat(apiException.getMessage()).isEqualTo("Ya existe un trabajador con ese email de contacto.");
                });
        verify(trabajadorRepository, never()).save(org.mockito.ArgumentMatchers.any(Trabajador.class));
    }

    @Test
    void crearTrabajadorConTelefonoDuplicadoDevuelveConflicto() {
        CrearTrabajadorRequest request = crearRequest("mario@example.com", "600111222");
        when(empresaRepository.findByCodigoAndActivaTrue("EMP-DEMO")).thenReturn(Optional.of(empresaDemo()));
        when(trabajadorRepository.existsByEmailContactoIgnoreCase("mario@example.com")).thenReturn(false);
        when(trabajadorRepository.existsByTelefonoContacto("600111222")).thenReturn(true);

        assertThatThrownBy(() -> service.crearTrabajador(request))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiException.getCode()).isEqualTo("TRABAJADOR_TELEFONO_DUPLICADO");
                    assertThat(apiException.getMessage()).isEqualTo("Ya existe un trabajador con ese teléfono de contacto.");
                });
        verify(trabajadorRepository, never()).save(org.mockito.ArgumentMatchers.any(Trabajador.class));
    }

    @Test
    void editarTrabajadorConservandoEmailYTelefonoPropiosNoFalla() {
        Trabajador trabajador = trabajadorBase();
        ActualizarTrabajadorRequest request = actualizarRequest("laura@example.com", "600111222");
        when(trabajadorRepository.findById(1L)).thenReturn(Optional.of(trabajador));
        when(trabajadorRepository.existsByEmailContactoIgnoreCaseAndIdNot("laura@example.com", 1L)).thenReturn(false);
        when(trabajadorRepository.existsByTelefonoContactoAndIdNot("600111222", 1L)).thenReturn(false);
        when(trabajadorEstanteriaRepository.findByTrabajadorIdAndActivaTrueOrderByEstanteriaCodigoAsc(1L))
                .thenReturn(List.of());
        when(tareaOperativaRepository.findAsignadasByTrabajadorAndEstadoIn(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of());

        var response = service.actualizarTrabajador(1L, request);

        assertThat(response.emailContacto()).isEqualTo("laura@example.com");
        assertThat(response.telefonoContacto()).isEqualTo("600111222");
    }

    @Test
    void editarTrabajadorConEmailDeOtroDevuelveConflicto() {
        Trabajador trabajador = trabajadorBase();
        ActualizarTrabajadorRequest request = actualizarRequest("mario@example.com", "600111222");
        when(trabajadorRepository.findById(1L)).thenReturn(Optional.of(trabajador));
        when(trabajadorRepository.existsByEmailContactoIgnoreCaseAndIdNot("mario@example.com", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.actualizarTrabajador(1L, request))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiException.getCode()).isEqualTo("TRABAJADOR_EMAIL_DUPLICADO");
                });
    }

    @Test
    void editarTrabajadorConTelefonoDeOtroDevuelveConflicto() {
        Trabajador trabajador = trabajadorBase();
        ActualizarTrabajadorRequest request = actualizarRequest("laura@example.com", "600333444");
        when(trabajadorRepository.findById(1L)).thenReturn(Optional.of(trabajador));
        when(trabajadorRepository.existsByEmailContactoIgnoreCaseAndIdNot("laura@example.com", 1L)).thenReturn(false);
        when(trabajadorRepository.existsByTelefonoContactoAndIdNot("600333444", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.actualizarTrabajador(1L, request))
                .isInstanceOf(ApiException.class)
                .satisfies(error -> {
                    ApiException apiException = (ApiException) error;
                    assertThat(apiException.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(apiException.getCode()).isEqualTo("TRABAJADOR_TELEFONO_DUPLICADO");
                });
    }

    private CrearTrabajadorRequest crearRequest(String email, String telefono) {
        return new CrearTrabajadorRequest(
                "Laura",
                "Encargada",
                email,
                telefono,
                TipoTrabajador.ENCARGADO,
                EstadoDisponibilidadTrabajador.DISPONIBLE
        );
    }

    private ActualizarTrabajadorRequest actualizarRequest(String email, String telefono) {
        return new ActualizarTrabajadorRequest(
                "Laura",
                "Encargada",
                email,
                telefono,
                TipoTrabajador.ENCARGADO,
                EstadoDisponibilidadTrabajador.DISPONIBLE
        );
    }

    private Trabajador trabajadorBase() {
        Trabajador trabajador = new Trabajador();
        trabajador.setId(1L);
        trabajador.setEmpresa(empresaDemo());
        trabajador.setNombre("Laura");
        trabajador.setApellidos("Encargada");
        trabajador.setEmailContacto("laura@example.com");
        trabajador.setTelefonoContacto("600111222");
        trabajador.setTipoTrabajador(TipoTrabajador.ENCARGADO);
        trabajador.setEstadoDisponibilidad(EstadoDisponibilidadTrabajador.DISPONIBLE);
        trabajador.setActivo(true);
        trabajador.setCreatedAt(Instant.now());
        trabajador.setUpdatedAt(Instant.now());
        return trabajador;
    }

    private Empresa empresaDemo() {
        Empresa empresa = new Empresa();
        empresa.setId(1L);
        empresa.setCodigo("EMP-DEMO");
        empresa.setNombre("Empresa Demo");
        empresa.setActiva(true);
        return empresa;
    }
}
