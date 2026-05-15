package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.PlanoEstanteriaLayout;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface PlanoEstanteriaLayoutRepository extends JpaRepository<PlanoEstanteriaLayout, Long> {

    @EntityGraph(attributePaths = {"planoZona", "planoZona.seccion", "estanteria", "estanteria.seccion"})
    List<PlanoEstanteriaLayout> findByPlanoIdOrderByIdAsc(Long planoId);

    @Modifying(flushAutomatically = true)
    void deleteByPlanoId(Long planoId);
}
