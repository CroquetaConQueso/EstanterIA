package com.proyectofincurso.estanteria.scheduler;

import com.proyectofincurso.estanteria.service.AlertaOperativaService;
import com.proyectofincurso.estanteria.web.dto.RevisionCaducidadesResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "app.alertas.caducidad.scheduler",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class CaducidadAsignacionesScheduler {

    private final AlertaOperativaService alertaOperativaService;

    @Scheduled(cron = "${app.alertas.caducidad.scheduler.cron:0 0 6 * * *}")
    public void ejecutarRevisionProgramada() {
        log.info("Iniciando revision programada de caducidades.");
        try {
            RevisionCaducidadesResponse resultado = alertaOperativaService.revisarCaducidades();
            log.info(
                    "Revision programada de caducidades completada: {} asignaciones revisadas, {} alertas creadas, {} existentes.",
                    resultado.asignacionesRevisadas(),
                    resultado.alertasCreadas(),
                    resultado.alertasExistentes()
            );
        } catch (Exception ex) {
            log.error("No se pudo completar la revision programada de caducidades.", ex);
        }
    }
}
