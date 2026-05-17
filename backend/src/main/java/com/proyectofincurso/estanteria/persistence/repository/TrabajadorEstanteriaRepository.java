package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import com.proyectofincurso.estanteria.persistence.entity.TrabajadorEstanteria;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TrabajadorEstanteriaRepository extends JpaRepository<TrabajadorEstanteria, Long> {

    @EntityGraph(attributePaths = {"trabajador"})
    List<TrabajadorEstanteria> findByEstanteriaCodigoIgnoreCaseAndActivaTrueOrderByTrabajadorApellidosAscTrabajadorNombreAsc(String codigo);

    @EntityGraph(attributePaths = {"trabajador", "estanteria", "estanteria.seccion", "estanteria.seccion.empresa"})
    Optional<TrabajadorEstanteria> findByEstanteriaIdAndTrabajadorId(Long estanteriaId, Long trabajadorId);

    @EntityGraph(attributePaths = {"estanteria", "estanteria.seccion"})
    List<TrabajadorEstanteria> findByTrabajadorIdAndActivaTrueOrderByEstanteriaCodigoAsc(Long trabajadorId);

    @EntityGraph(attributePaths = {"trabajador", "estanteria", "estanteria.seccion"})
    @Query("""
            select asignacion
            from TrabajadorEstanteria asignacion
            where asignacion.activa = true
              and asignacion.estanteria.activa = true
              and (
                    asignacion.trabajador.activo = false
                    or asignacion.trabajador.estadoDisponibilidad in :estados
              )
            order by asignacion.estanteria.codigo asc, asignacion.trabajador.apellidos asc, asignacion.trabajador.nombre asc
            """)
    List<TrabajadorEstanteria> findActivasConTrabajadorNoDisponible(@Param("estados") Collection<EstadoDisponibilidadTrabajador> estados);
}
