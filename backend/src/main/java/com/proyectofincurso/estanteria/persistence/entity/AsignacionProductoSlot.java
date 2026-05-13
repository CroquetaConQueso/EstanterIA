package com.proyectofincurso.estanteria.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "asignacion_producto_slot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsignacionProductoSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asignacion_producto_slot_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slot_configuracion_id", nullable = false)
    private EstanteriaSlotConfiguracion slotConfiguracion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_proveedor_id", nullable = false)
    private ProductoProveedor productoProveedor;

    @Column(name = "fecha_colocacion")
    private LocalDate fechaColocacion;

    @Column(name = "fecha_caducidad")
    private LocalDate fechaCaducidad;

    @Column(name = "fecha_retirada_programada")
    private LocalDate fechaRetiradaProgramada;

    @Column(name = "fecha_retirada_confirmada")
    private LocalDate fechaRetiradaConfirmada;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_asignacion", nullable = false, length = 30)
    private EstadoAsignacionProductoSlot estadoAsignacion;

    @Column(name = "observaciones", columnDefinition = "text")
    private String observaciones;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
