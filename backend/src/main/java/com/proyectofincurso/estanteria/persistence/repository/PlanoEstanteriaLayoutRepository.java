package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.PlanoEstanteriaLayout;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;

public interface PlanoEstanteriaLayoutRepository extends JpaRepository<PlanoEstanteriaLayout, Long> {

    @EntityGraph(attributePaths = {"planoZona", "planoZona.seccion", "estanteria", "estanteria.seccion"})
    List<PlanoEstanteriaLayout> findByPlanoIdOrderByIdAsc(Long planoId);

    Optional<PlanoEstanteriaLayout> findByPlanoIdAndEstanteriaId(Long planoId, Long estanteriaId);

    @Modifying(flushAutomatically = true)
    void deleteByPlanoId(Long planoId);
}
