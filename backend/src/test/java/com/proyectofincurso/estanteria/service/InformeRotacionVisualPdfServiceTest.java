package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualFiltrosResponse;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualPeriodoResponse;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualResponse;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoSinVaciosResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoVaciadoResponse;
import com.proyectofincurso.estanteria.web.dto.ResumenDiaSemanaResponse;
import com.proyectofincurso.estanteria.web.dto.SlotVaciadoResponse;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class InformeRotacionVisualPdfServiceTest {

    private final InformeRotacionVisualPdfService service = new InformeRotacionVisualPdfService();

    @Test
    void generaPdfNoVacioConCabeceraPdf() {
        byte[] pdf = service.generarPdf(informeDemo());

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    private InformeRotacionVisualResponse informeDemo() {
        return new InformeRotacionVisualResponse(
                new InformeRotacionVisualPeriodoResponse(
                        LocalDate.of(2026, 5, 1),
                        LocalDate.of(2026, 5, 17)
                ),
                new InformeRotacionVisualFiltrosResponse(
                        "PLANO-DEMO",
                        1L,
                        "Despensa",
                        "EST-001"
                ),
                new InformeRotacionVisualResumenResponse(4, 16, 5, 10, 1),
                List.of(new ProductoVaciadoResponse(
                        10L,
                        "PROD-ARROZ",
                        "Arroz",
                        "Despensa",
                        "EST-001",
                        "slot_2",
                        3,
                        1,
                        0,
                        4,
                        75.0,
                        Instant.parse("2026-05-16T10:00:00Z")
                )),
                List.of(new SlotVaciadoResponse(
                        "Despensa",
                        "EST-001",
                        "slot_2",
                        "Arroz",
                        3,
                        4,
                        75.0
                )),
                List.of(new ProductoSinVaciosResponse(
                        11L,
                        "PROD-LENTEJAS",
                        "Lentejas",
                        4,
                        0
                )),
                List.of(new ResumenDiaSemanaResponse("Lunes", 2))
        );
    }
}
