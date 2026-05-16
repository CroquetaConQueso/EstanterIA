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

@Entity
@Table(name = "trabajador")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Trabajador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trabajador_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "apellidos", length = 150)
    private String apellidos;

    @Column(name = "email_contacto", length = 160)
    private String emailContacto;

    @Column(name = "telefono_contacto", length = 40)
    private String telefonoContacto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_trabajador", nullable = false, length = 30)
    private TipoTrabajador tipoTrabajador;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_disponibilidad", length = 30)
    private EstadoDisponibilidadTrabajador estadoDisponibilidad = EstadoDisponibilidadTrabajador.DISPONIBLE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
