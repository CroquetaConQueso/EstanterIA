package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Empresa;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.TipoTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.TrabajadorEstanteria;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EmpresaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProductoProveedorRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProductoRepository;
import com.proyectofincurso.estanteria.persistence.repository.ProveedorRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionEncargadoRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorEstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModeloOperativoServiceTrabajadorEstanteriaTest {

    @Mock
    private EmpresaRepository empresaRepository;
    @Mock
    private SeccionRepository seccionRepository;
    @Mock
    private EstanteriaRepository estanteriaRepository;
    @Mock
    private EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    @Mock
    private AsignacionProductoSlotRepository asignacionProductoSlotRepository;
    @Mock
    private SeccionEncargadoRepository seccionEncargadoRepository;
    @Mock
    private ProductoRepository productoRepository;
    @Mock
    private ProductoProveedorRepository productoProveedorRepository;
    @Mock
    private ProveedorRepository proveedorRepository;
    @Mock
    private TrabajadorRepository trabajadorRepository;
    @Mock
    private TrabajadorEstanteriaRepository trabajadorEstanteriaRepository;
    @Mock
    private AlertaOperativaService alertaOperativaService;

    @InjectMocks
    private ModeloOperativoService service;

    @Test
    void asignarTrabajadorDisponibleCreaAsignacionActiva() {
        Estanteria estanteria = estanteria(true);
        Trabajador trabajador = trabajador(EstadoDisponibilidadTrabajador.DISPONIBLE, true);
        when(estanteriaRepository.findWithSeccionByCodigoIgnoreCase("EST-001")).thenReturn(Optional.of(estanteria));
        when(trabajadorRepository.findById(2L)).thenReturn(Optional.of(trabajador));
        when(trabajadorEstanteriaRepository.findByEstanteriaIdAndTrabajadorId(1L, 2L)).thenReturn(Optional.empty());

        var response = service.asignarTrabajadorEstanteria("EST-001", 2L);

        ArgumentCaptor<TrabajadorEstanteria> captor = ArgumentCaptor.forClass(TrabajadorEstanteria.class);
        verify(trabajadorEstanteriaRepository).save(captor.capture());
        assertThat(captor.getValue().getActiva()).isTrue();
        assertThat(captor.getValue().getTrabajador()).isEqualTo(trabajador);
        assertThat(captor.getValue().getEstanteria()).isEqualTo(estanteria);
        assertThat(response.trabajadorId()).isEqualTo(2L);
    }

    @Test
    void noPermiteAsignarTrabajadorNoDisponible() {
        when(estanteriaRepository.findWithSeccionByCodigoIgnoreCase("EST-001")).thenReturn(Optional.of(estanteria(true)));
        when(trabajadorRepository.findById(2L)).thenReturn(Optional.of(trabajador(EstadoDisponibilidadTrabajador.AUSENTE, true)));

        assertThatThrownBy(() -> service.asignarTrabajadorEstanteria("EST-001", 2L))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void noPermiteAsignarEnEstanteriaInactiva() {
        when(estanteriaRepository.findWithSeccionByCodigoIgnoreCase("EST-001")).thenReturn(Optional.of(estanteria(false)));

        assertThatThrownBy(() -> service.asignarTrabajadorEstanteria("EST-001", 2L))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
    }

    private Estanteria estanteria(boolean activa) {
        Empresa empresa = new Empresa();
        empresa.setId(100L);
        empresa.setCodigo("EMP-DEMO");

        Seccion seccion = new Seccion();
        seccion.setId(10L);
        seccion.setEmpresa(empresa);

        Estanteria estanteria = new Estanteria();
        estanteria.setId(1L);
        estanteria.setCodigo("EST-001");
        estanteria.setNombre("Estanteria demo");
        estanteria.setActiva(activa);
        estanteria.setSeccion(seccion);
        return estanteria;
    }

    private Trabajador trabajador(EstadoDisponibilidadTrabajador disponibilidad, boolean activo) {
        Empresa empresa = new Empresa();
        empresa.setId(100L);
        empresa.setCodigo("EMP-DEMO");

        Trabajador trabajador = new Trabajador();
        trabajador.setId(2L);
        trabajador.setNombre("Laura");
        trabajador.setApellidos("Responsable");
        trabajador.setTipoTrabajador(TipoTrabajador.ENCARGADO);
        trabajador.setEstadoDisponibilidad(disponibilidad);
        trabajador.setActivo(activo);
        trabajador.setEmpresa(empresa);
        return trabajador;
    }
}
