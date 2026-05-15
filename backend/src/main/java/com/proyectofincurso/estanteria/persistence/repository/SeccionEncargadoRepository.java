package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.SeccionEncargado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SeccionEncargadoRepository extends JpaRepository<SeccionEncargado, Long> {
    @Query("""
            select asignacion
            from SeccionEncargado asignacion
            join fetch asignacion.trabajador trabajador
            where asignacion.seccion.id = :seccionId
              and asignacion.activo = true
              and trabajador.activo = true
            order by asignacion.responsablePrincipal desc, trabajador.apellidos asc, trabajador.nombre asc
            """)
    List<SeccionEncargado> findEncargadosActivosBySeccionId(@Param("seccionId") Long seccionId);

    @Query("""
            select asignacion
            from SeccionEncargado asignacion
            join fetch asignacion.seccion seccion
            join fetch asignacion.trabajador trabajador
            where seccion.id in :seccionIds
              and asignacion.activo = true
              and trabajador.activo = true
            order by seccion.id asc, asignacion.responsablePrincipal desc, trabajador.apellidos asc, trabajador.nombre asc
            """)
    List<SeccionEncargado> findEncargadosActivosBySeccionIds(@Param("seccionIds") List<Long> seccionIds);

    List<SeccionEncargado> findBySeccionIdAndActivoTrue(Long seccionId);

    Optional<SeccionEncargado> findBySeccionIdAndTrabajadorId(Long seccionId, Long trabajadorId);
}
