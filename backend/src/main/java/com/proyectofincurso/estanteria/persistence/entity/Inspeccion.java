package com.proyectofincurso.estanteria.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "inspeccion",
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estanteria_id")
    private Estanteria estanteria;

    @Column(name = "notas", columnDefinition = "text")
    private String notas;

    @Column(name = "imagen_path", length = 255)
    private String imagenPath;

    @Column(name = "imagen_nombre_archivo", length = 255)
    private String imagenNombreArchivo;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstanteriaEstado estado;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_general_visual", length = 30)
    private EstadoGeneralVisual estadoGeneralVisual;

    @Column(name = "slots_totales")
    private Integer slotsTotales;

    @Column(name = "ocupados")
    private Integer ocupados;

    @Column(name = "vacios")
    private Integer vacios;

    @Column(name = "anomalias")
    private Integer anomalias;

    @Column(name = "hay_huecos_vacios")
    private Boolean hayHuecosVacios;

    @Column(name = "hay_anomalias")
    private Boolean hayAnomalias;

    @Column(name = "modelo_version", length = 80)
    private String modeloVersion;

    @Column(name = "capturada_en")
    private Instant capturadaEn;

    @OneToMany(mappedBy = "inspeccion", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<InspeccionSlotResultado> slots = new ArrayList<>();

    //Se ejecuta antes den insert, nos permite no tener que setear a mano cada vez que 
    // se haga createdAt = Instant.now() o se establezca un ENUM
    @PrePersist
    void prePersist() {
        if (estado == null) estado = EstanteriaEstado.CREADA;
        // createdAt lo rellena @CreationTimestamp; 
    }
}
