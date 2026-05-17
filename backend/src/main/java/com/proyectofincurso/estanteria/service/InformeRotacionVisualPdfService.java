package com.proyectofincurso.estanteria.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.proyectofincurso.estanteria.web.dto.InformeRotacionVisualResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoSinVaciosResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoVaciadoResponse;
import com.proyectofincurso.estanteria.web.dto.ResumenDiaSemanaResponse;
import com.proyectofincurso.estanteria.web.dto.SlotVaciadoResponse;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class InformeRotacionVisualPdfService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Color HEADER_BACKGROUND = new Color(230, 223, 215);
    private static final Color DARK = new Color(17, 17, 17);

    public byte[] generarPdf(InformeRotacionVisualResponse informe) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 42);
            PdfWriter.getInstance(document, output);
            document.open();

            addTitulo(document);
            addPeriodoYFiltros(document, informe);
            addResumen(document, informe);
            addProductosMasVaciados(document, informe.productosMasVaciados());
            addSlotsMasVaciados(document, informe.slotsMasVaciados());
            addProductosSinVacios(document, informe.productosSinVacios());
            addResumenPorDia(document, informe.resumenPorDiaSemana());
            addPie(document);

            document.close();
            return output.toByteArray();
        } catch (DocumentException ex) {
            throw new IllegalStateException("No se pudo generar el PDF del informe de rotacion visual.", ex);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el PDF del informe de rotacion visual.", ex);
        }
    }

    private void addTitulo(Document document) {
        Paragraph titulo = new Paragraph("Informe de rotacion visual", font(18, Font.BOLD));
        titulo.setAlignment(Element.ALIGN_LEFT);
        titulo.setSpacingAfter(6);
        document.add(titulo);

        Paragraph subtitulo = new Paragraph(
                "Vaciados detectados a partir de inspecciones visuales",
                font(11, Font.BOLD)
        );
        subtitulo.setSpacingAfter(8);
        document.add(subtitulo);

        Paragraph nota = new Paragraph(
                "Este informe no representa ventas reales. Resume vacios detectados visualmente en inspecciones.",
                font(9, Font.NORMAL)
        );
        nota.setSpacingAfter(12);
        document.add(nota);

        Paragraph generado = new Paragraph(
                "Fecha de generacion: " + LocalDateTime.now().format(DATE_TIME_FORMATTER),
                font(9, Font.NORMAL)
        );
        generado.setSpacingAfter(14);
        document.add(generado);
    }

    private void addPeriodoYFiltros(Document document, InformeRotacionVisualResponse informe) {
        addSectionTitle(document, "Periodo y filtros aplicados");
        PdfPTable table = table(2);
        addHeader(table, "Campo");
        addHeader(table, "Valor");
        addRow(table, "Desde", informe.periodo().fechaDesde().format(DATE_FORMATTER));
        addRow(table, "Hasta", informe.periodo().fechaHasta().format(DATE_FORMATTER));
        addRow(table, "Plano", value(informe.filtros().planoCodigo()));
        addRow(table, "Seccion", value(informe.filtros().seccionNombre()));
        addRow(table, "Estanteria", value(informe.filtros().estanteriaCodigo()));
        addTable(document, table);
    }

    private void addResumen(Document document, InformeRotacionVisualResponse informe) {
        addSectionTitle(document, "Resumen");
        PdfPTable table = table(2);
        addHeader(table, "Metrica");
        addHeader(table, "Total");
        addRow(table, "Total inspecciones", informe.resumen().totalInspecciones());
        addRow(table, "Resultados de slot", informe.resumen().totalResultadosSlot());
        addRow(table, "Vacios detectados", informe.resumen().totalVaciosDetectados());
        addRow(table, "Ocupados detectados", informe.resumen().totalOcupadosDetectados());
        addRow(table, "Anomalias detectadas", informe.resumen().totalAnomaliasDetectadas());
        addTable(document, table);
    }

    private void addProductosMasVaciados(Document document, List<ProductoVaciadoResponse> productos) {
        addSectionTitle(document, "Productos con mas vacios detectados");
        PdfPTable table = table(7);
        addHeaders(table, "Producto", "Seccion", "Estanteria", "Slot", "Vacios", "Total", "% vacio");
        if (productos == null || productos.isEmpty()) {
            addEmptyRow(table, 7, "No hay vacios detectados en el periodo seleccionado.");
        } else {
            productos.forEach(producto -> addRow(table,
                    value(producto.productoNombre()),
                    value(producto.seccionNombre()),
                    value(producto.estanteriaCodigo()),
                    value(producto.slotId()),
                    value(producto.vaciosDetectados()),
                    value(producto.totalInspecciones()),
                    percent(producto.porcentajeVacio())
            ));
        }
        addTable(document, table);
    }

    private void addSlotsMasVaciados(Document document, List<SlotVaciadoResponse> slots) {
        addSectionTitle(document, "Slots mas vaciados");
        PdfPTable table = table(7);
        addHeaders(table, "Seccion", "Estanteria", "Slot", "Producto esperado", "Vacios", "Total", "% vacio");
        if (slots == null || slots.isEmpty()) {
            addEmptyRow(table, 7, "No hay slots con vacios detectados en el periodo seleccionado.");
        } else {
            slots.forEach(slot -> addRow(table,
                    value(slot.seccionNombre()),
                    value(slot.estanteriaCodigo()),
                    value(slot.slotId()),
                    value(slot.productoEsperadoNombre()),
                    value(slot.vaciosDetectados()),
                    value(slot.totalInspecciones()),
                    percent(slot.porcentajeVacio())
            ));
        }
        addTable(document, table);
    }

    private void addProductosSinVacios(Document document, List<ProductoSinVaciosResponse> productos) {
        addSectionTitle(document, "Productos sin vacios detectados");
        PdfPTable table = table(4);
        addHeaders(table, "Producto", "Codigo", "Total inspecciones", "Vacios");
        if (productos == null || productos.isEmpty()) {
            addEmptyRow(table, 4, "No hay productos sin vacios detectados para este periodo.");
        } else {
            productos.forEach(producto -> addRow(table,
                    value(producto.productoNombre()),
                    value(producto.productoCodigo()),
                    value(producto.totalInspecciones()),
                    value(producto.vaciosDetectados())
            ));
        }
        addTable(document, table);
    }

    private void addResumenPorDia(Document document, List<ResumenDiaSemanaResponse> dias) {
        addSectionTitle(document, "Vacios por dia de la semana");
        PdfPTable table = table(2);
        addHeader(table, "Dia");
        addHeader(table, "Vacios detectados");
        if (dias == null || dias.isEmpty()) {
            addEmptyRow(table, 2, "No hay datos por dia de la semana.");
        } else {
            dias.forEach(dia -> addRow(table, value(dia.diaSemana()), value(dia.vaciosDetectados())));
        }
        addTable(document, table);
    }

    private void addPie(Document document) {
        Paragraph pie = new Paragraph("Generado por EstanterIA", font(8, Font.NORMAL));
        pie.setAlignment(Element.ALIGN_RIGHT);
        pie.setSpacingBefore(10);
        document.add(pie);
    }

    private void addSectionTitle(Document document, String title) {
        Paragraph paragraph = new Paragraph(title, font(12, Font.BOLD));
        paragraph.setSpacingBefore(8);
        paragraph.setSpacingAfter(6);
        document.add(paragraph);
    }

    private PdfPTable table(int columns) {
        PdfPTable table = new PdfPTable(columns);
        table.setWidthPercentage(100);
        table.setSpacingAfter(10);
        return table;
    }

    private void addTable(Document document, PdfPTable table) {
        document.add(table);
    }

    private void addHeaders(PdfPTable table, String... headers) {
        for (String header : headers) {
            addHeader(table, header);
        }
    }

    private void addHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(8, Font.BOLD)));
        cell.setBackgroundColor(HEADER_BACKGROUND);
        cell.setBorderColor(DARK);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addRow(PdfPTable table, Object... values) {
        for (Object rowValue : values) {
            PdfPCell cell = new PdfPCell(new Phrase(value(rowValue), font(8, Font.NORMAL)));
            cell.setPadding(5);
            cell.setBorderColor(DARK);
            table.addCell(cell);
        }
    }

    private void addEmptyRow(PdfPTable table, int colspan, String message) {
        PdfPCell cell = new PdfPCell(new Phrase(message, font(8, Font.NORMAL)));
        cell.setColspan(colspan);
        cell.setPadding(6);
        cell.setBorderColor(DARK);
        table.addCell(cell);
    }

    private Font font(int size, int style) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, DARK);
    }

    private String value(Object value) {
        if (value == null) {
            return "-";
        }
        String text = String.valueOf(value);
        return text.isBlank() ? "-" : text;
    }

    private String percent(Double value) {
        if (value == null) {
            return "-";
        }
        return String.format("%.1f%%", value);
    }
}
