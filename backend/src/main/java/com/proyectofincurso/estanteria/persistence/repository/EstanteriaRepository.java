package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EstanteriaRepository extends JpaRepository<Estanteria, Long> {
    List<Estanteria> findBySeccionIdAndActivaTrueOrderByCodigoAsc(Long seccionId);

    Optional<Estanteria> findByCodigoAndActivaTrue(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);

    @EntityGraph(attributePaths = {"seccion", "seccion.empresa"})
    Optional<Estanteria> findWithSeccionByCodigoAndActivaTrue(String codigo);
}
