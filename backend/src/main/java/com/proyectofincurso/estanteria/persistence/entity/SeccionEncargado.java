package com.proyectofincurso.estanteria.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "seccion_encargado")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeccionEncargado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seccion_encargado_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seccion_id", nullable = false)
    private Seccion seccion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trabajador_id", nullable = false)
    private Trabajador trabajador;

    @Column(name = "responsable_principal", nullable = false)
    private Boolean responsablePrincipal = false;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "asignado_at", nullable = false)
    private Instant asignadoAt;
}
