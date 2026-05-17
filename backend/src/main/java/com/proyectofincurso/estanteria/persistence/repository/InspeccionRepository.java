package com.proyectofincurso.estanteria.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

public interface InspeccionRepository extends JpaRepository<Inspeccion,Long>{
    @Query("""
            select distinct inspeccion
            from Inspeccion inspeccion
            left join fetch inspeccion.slots
            left join fetch inspeccion.estanteria estanteria
            left join fetch estanteria.seccion
            where inspeccion.id = :id
            """)
    Optional<Inspeccion> findByIdConSlotsYEstanteria(@Param("id") Long id);

    @Query("""
            select inspeccion
            from Inspeccion inspeccion
            where inspeccion.estanteria.id = :estanteriaId
              and exists (
                  select 1
                  from InspeccionSlotResultado slot
                  where slot.inspeccion = inspeccion
              )
            order by coalesce(inspeccion.capturadaEn, inspeccion.createdAt) desc
            """)
    List<Inspeccion> findUltimasConSlotsByEstanteriaId(@Param("estanteriaId") Long estanteriaId,
                                                       Pageable pageable);

    @Query("""
            select distinct inspeccion
            from Inspeccion inspeccion
            left join fetch inspeccion.slots
            left join fetch inspeccion.estanteria estanteria
            left join fetch estanteria.seccion seccion
            where coalesce(inspeccion.capturadaEn, inspeccion.createdAt) >= :desde
              and coalesce(inspeccion.capturadaEn, inspeccion.createdAt) < :hastaExclusiva
              and (:seccionId is null or seccion.id = :seccionId)
            """)
    List<Inspeccion> findParaInformeRotacionVisual(@Param("desde") Instant desde,
                                                    @Param("hastaExclusiva") Instant hastaExclusiva,
                                                   @Param("seccionId") Long seccionId);

    @Query("""
            select distinct inspeccion
            from Inspeccion inspeccion
            left join fetch inspeccion.slots
            left join fetch inspeccion.estanteria estanteria
            left join fetch estanteria.seccion seccion
            where coalesce(inspeccion.capturadaEn, inspeccion.createdAt) >= :desde
              and coalesce(inspeccion.capturadaEn, inspeccion.createdAt) < :hastaExclusiva
              and (:seccionId is null or seccion.id = :seccionId)
              and lower(estanteria.codigo) = :estanteriaCodigoLower
            """)
    List<Inspeccion> findParaInformeRotacionVisualPorEstanteria(@Param("desde") Instant desde,
                                                                @Param("hastaExclusiva") Instant hastaExclusiva,
                                                                @Param("seccionId") Long seccionId,
                                                                @Param("estanteriaCodigoLower") String estanteriaCodigoLower);
}
