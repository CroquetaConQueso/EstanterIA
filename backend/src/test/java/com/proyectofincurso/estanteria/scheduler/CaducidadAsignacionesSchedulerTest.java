package com.proyectofincurso.estanteria.scheduler;

import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.RevisionCaducidadesResponse;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CaducidadAsignacionesSchedulerTest {

    @Test
    void schedulerReutilizaServicioDeRevisionDeCaducidades() {
        AlertaOperativaService alertaOperativaService = mock(AlertaOperativaService.class);
        when(alertaOperativaService.revisarCaducidades())
                .thenReturn(new RevisionCaducidadesResponse(3, 1, 2, "Revision completada"));
        CaducidadAsignacionesScheduler scheduler = new CaducidadAsignacionesScheduler(alertaOperativaService);

        scheduler.ejecutarRevisionProgramada();

        verify(alertaOperativaService).revisarCaducidades();
    }
}
