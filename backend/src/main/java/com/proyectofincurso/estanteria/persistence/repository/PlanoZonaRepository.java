package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.PlanoZona;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface PlanoZonaRepository extends JpaRepository<PlanoZona, Long> {

    @EntityGraph(attributePaths = {"seccion"})
    List<PlanoZona> findByPlanoIdOrderByIdAsc(Long planoId);

    @Modifying(flushAutomatically = true)
    void deleteByPlanoId(Long planoId);
}
