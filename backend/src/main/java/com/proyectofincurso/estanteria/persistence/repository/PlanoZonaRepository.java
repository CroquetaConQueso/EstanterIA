package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.PlanoZona;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlanoZonaRepository extends JpaRepository<PlanoZona, Long> {

    @EntityGraph(attributePaths = {"seccion"})
    List<PlanoZona> findByPlanoIdOrderByIdAsc(Long planoId);

    Optional<PlanoZona> findByPlanoIdAndSeccionId(Long planoId, Long seccionId);

    @Query("""
            select distinct zona.seccion.id
            from PlanoZona zona
            join zona.plano plano
            where plano.empresa.id = :empresaId
              and plano.activo = true
            """)
    List<Long> findSeccionIdsUsadasEnPlanosActivos(@Param("empresaId") Long empresaId);

    @Query("""
            select distinct zona.seccion.id
            from PlanoZona zona
            join zona.plano plano
            where plano.empresa.id = :empresaId
              and plano.activo = true
              and plano.id <> :planoId
            """)
    List<Long> findSeccionIdsUsadasEnOtrosPlanosActivos(@Param("empresaId") Long empresaId,
                                                        @Param("planoId") Long planoId);

    @Modifying(flushAutomatically = true)
    void deleteByPlanoId(Long planoId);
}
