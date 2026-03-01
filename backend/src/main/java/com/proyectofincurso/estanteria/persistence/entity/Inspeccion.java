package com.proyectofincurso.estanteria.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "inspeccion")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Inspeccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspeccion_id")
    private Long id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "estanteria_codigo", nullable = false, length = 50)
    private String estanteriaCodigo;

    @Column(name = "notas", columnDefinition = "text")
    private String notas;

    @Column(name = "imagen_path", length = 255)
    private String imagenPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstanteriaEstado estado;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (estado == null) estado = EstanteriaEstado.CREADA;
    }
}