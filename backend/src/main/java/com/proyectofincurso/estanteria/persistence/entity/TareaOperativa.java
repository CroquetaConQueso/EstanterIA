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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "tarea_operativa", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tarea_operativa_alerta", columnNames = "alerta_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TareaOperativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tarea_operativa_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "alerta_id", nullable = false)
    private Alerta alerta;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_tarea", nullable = false, length = 50)
    private TipoTareaOperativa tipoTarea;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridad", nullable = false, length = 20)
    private PrioridadAlerta prioridad;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_tarea", nullable = false, length = 30)
    private EstadoTareaOperativa estadoTarea;

    @Column(name = "titulo", nullable = false, length = 200)
    private String titulo;

    @Column(name = "descripcion", nullable = false, columnDefinition = "text")
    private String descripcion;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trabajador_asignado_id")
    private Trabajador trabajadorAsignado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignada_por_user_account_id")
    private UserAccount asignadaPor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "fecha_limite")
    private Instant fechaLimite;

    @Column(name = "resuelta_at")
    private Instant resueltaAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant ahora = Instant.now();
        if (estadoTarea == null) {
            estadoTarea = EstadoTareaOperativa.PENDIENTE;
        }
        if (createdAt == null) {
            createdAt = ahora;
        }
        if (updatedAt == null) {
            updatedAt = ahora;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
