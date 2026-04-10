package com.proyectofincurso.estanteria.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "inspeccion",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_inspeccion_estanteria_codigo",
            columnNames = "estanteria_codigo"
        )
    },
    indexes = {
        @Index(name = "idx_inspeccion_created_at", columnList = "created_at"),
        @Index(name = "idx_inspeccion_estanteria_codigo", columnList = "estanteria_codigo")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Inspeccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspeccion_id")
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "estanteria_codigo", nullable = false, length = 50)
    private String estanteriaCodigo;

    @Column(name = "notas", columnDefinition = "text")
    private String notas;

    @Column(name = "imagen_path", length = 255)
    private String imagenPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, columnDefinition = "estado_estanteria")
    private EstanteriaEstado estado;

    //Se ejecuta antes den insert, nos permite no tener que setear a mano cada vez que 
    // se haga createdAt = Instant.now() o se establezca un ENUM
    @PrePersist
    void prePersist() {
        if (estado == null) estado = EstanteriaEstado.CREADA;
        // createdAt lo rellena @CreationTimestamp; 
    }
}