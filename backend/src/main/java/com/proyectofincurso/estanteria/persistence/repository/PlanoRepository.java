package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Plano;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlanoRepository extends JpaRepository<Plano, Long> {

    boolean existsByCodigo(String codigo);

    @EntityGraph(attributePaths = {"empresa"})
    Optional<Plano> findWithEmpresaByCodigo(String codigo);

    List<Plano> findByEmpresaCodigoAndActivoTrueOrderByNombreAsc(String codigoEmpresa);
}
