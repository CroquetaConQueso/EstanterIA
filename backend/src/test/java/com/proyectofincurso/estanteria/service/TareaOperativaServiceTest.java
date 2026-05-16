package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.repository.AsignacionProductoSlotRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaRepository;
import com.proyectofincurso.estanteria.persistence.repository.EstanteriaSlotConfiguracionRepository;
import com.proyectofincurso.estanteria.persistence.repository.SeccionRepository;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.error.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TareaOperativaServiceTest {

    @Mock
    private TareaOperativaRepository tareaOperativaRepository;
    @Mock
    private AsignacionProductoSlotRepository asignacionProductoSlotRepository;
    @Mock
    private SeccionRepository seccionRepository;
    @Mock
    private EstanteriaRepository estanteriaRepository;
    @Mock
    private EstanteriaSlotConfiguracionRepository slotConfiguracionRepository;
    @Mock
    private TrabajadorRepository trabajadorRepository;
    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private TareaOperativaService service;

    @Test
    void reabrirTareaResueltaLaDevuelveAPendiente() {
        TareaOperativa tarea = tarea(EstadoTareaOperativa.RESUELTA);
        tarea.setResueltaAt(Instant.parse("2026-05-16T10:15:30Z"));
        when(tareaOperativaRepository.findByIdConContexto(1L)).thenReturn(Optional.of(tarea));

        var response = service.reabrirTarea(1L);

        assertThat(response.estadoTarea()).isEqualTo(EstadoTareaOperativa.PENDIENTE);
        assertThat(tarea.getEstadoTarea()).isEqualTo(EstadoTareaOperativa.PENDIENTE);
        assertThat(tarea.getResueltaAt()).isNull();
    }

    @Test
    void reabrirTareaCanceladaLaDevuelveAPendiente() {
        TareaOperativa tarea = tarea(EstadoTareaOperativa.CANCELADA);
        when(tareaOperativaRepository.findByIdConContexto(2L)).thenReturn(Optional.of(tarea));

        var response = service.reabrirTarea(2L);

        assertThat(response.estadoTarea()).isEqualTo(EstadoTareaOperativa.PENDIENTE);
        assertThat(tarea.getEstadoTarea()).isEqualTo(EstadoTareaOperativa.PENDIENTE);
    }

    @Test
    void reabrirTareaInexistenteDevuelveNotFound() {
        when(tareaOperativaRepository.findByIdConContexto(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.reabrirTarea(99L))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void reabrirTareaEnProgresoDevuelveConflicto() {
        TareaOperativa tarea = tarea(EstadoTareaOperativa.EN_PROGRESO);
        when(tareaOperativaRepository.findByIdConContexto(3L)).thenReturn(Optional.of(tarea));

        assertThatThrownBy(() -> service.reabrirTarea(3L))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void alertaRetiradaProgramadaPendienteGeneraTareaAutomaticaDeRetirada() {
        Alerta alerta = new Alerta();
        alerta.setId(10L);
        alerta.setTipoAlerta(TipoAlerta.RETIRADA_PROGRAMADA_PENDIENTE);
        alerta.setPrioridad(PrioridadAlerta.ALTA);
        alerta.setEstadoAlerta(EstadoAlerta.ABIERTA);
        when(tareaOperativaRepository.existsByAlertaId(10L)).thenReturn(false);

        service.crearAutomaticaSiNoExiste(alerta);

        ArgumentCaptor<TareaOperativa> captor = ArgumentCaptor.forClass(TareaOperativa.class);
        verify(tareaOperativaRepository).save(captor.capture());
        TareaOperativa tarea = captor.getValue();
        assertThat(tarea.getAlerta()).isEqualTo(alerta);
        assertThat(tarea.getTipoTarea()).isEqualTo(TipoTareaOperativa.RETIRADA_PRODUCTO);
        assertThat(tarea.getPrioridad()).isEqualTo(PrioridadAlerta.ALTA);
        assertThat(tarea.getEstadoTarea()).isEqualTo(EstadoTareaOperativa.PENDIENTE);
    }

    private TareaOperativa tarea(EstadoTareaOperativa estado) {
        TareaOperativa tarea = new TareaOperativa();
        tarea.setId(1L);
        tarea.setTipoTarea(TipoTareaOperativa.REPOSICION);
        tarea.setPrioridad(PrioridadAlerta.MEDIA);
        tarea.setEstadoTarea(estado);
        tarea.setTitulo("Reponer producto");
        tarea.setDescripcion("Tarea de prueba");
        tarea.setCreatedAt(Instant.parse("2026-05-16T09:00:00Z"));
        tarea.setUpdatedAt(Instant.parse("2026-05-16T09:00:00Z"));
        return tarea;
    }
}
