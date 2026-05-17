package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.TrabajadorEstanteria;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrabajadorEstanteriaRepository extends JpaRepository<TrabajadorEstanteria, Long> {

    @EntityGraph(attributePaths = {"trabajador"})
    List<TrabajadorEstanteria> findByEstanteriaCodigoIgnoreCaseAndActivaTrueOrderByTrabajadorApellidosAscTrabajadorNombreAsc(String codigo);

    @EntityGraph(attributePaths = {"trabajador", "estanteria", "estanteria.seccion", "estanteria.seccion.empresa"})
    Optional<TrabajadorEstanteria> findByEstanteriaIdAndTrabajadorId(Long estanteriaId, Long trabajadorId);

    @EntityGraph(attributePaths = {"estanteria", "estanteria.seccion"})
    List<TrabajadorEstanteria> findByTrabajadorIdAndActivaTrueOrderByEstanteriaCodigoAsc(Long trabajadorId);
}
