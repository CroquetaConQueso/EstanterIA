package com.proyectofincurso.estanteria.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;

import java.util.Optional;

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
}
