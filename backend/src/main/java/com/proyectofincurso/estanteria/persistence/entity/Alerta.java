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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "alerta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alerta_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_alerta", nullable = false, length = 60)
    private TipoAlerta tipoAlerta;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridad", nullable = false, length = 20)
    private PrioridadAlerta prioridad;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_alerta", nullable = false, length = 20)
    private EstadoAlerta estadoAlerta;

    @Column(name = "mensaje", nullable = false, columnDefinition = "text")
    private String mensaje;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resuelta_at")
    private Instant resueltaAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspeccion_id")
    private Inspeccion inspeccion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspeccion_slot_resultado_id")
    private InspeccionSlotResultado inspeccionSlotResultado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seccion_id")
    private Seccion seccion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estanteria_id")
    private Estanteria estanteria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_configuracion_id")
    private EstanteriaSlotConfiguracion slotConfiguracion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignacion_producto_slot_id")
    private AsignacionProductoSlot asignacionProductoSlot;

    @PrePersist
    void prePersist() {
        if (estadoAlerta == null) {
            estadoAlerta = EstadoAlerta.ABIERTA;
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
