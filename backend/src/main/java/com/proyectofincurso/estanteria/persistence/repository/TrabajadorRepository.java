package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.EstadoDisponibilidadTrabajador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TrabajadorRepository extends JpaRepository<Trabajador, Long> {
    List<Trabajador> findByEmpresaCodigoAndActivoTrueOrderByApellidosAscNombreAsc(String codigoEmpresa);

    List<Trabajador> findByActivoTrueOrderByApellidosAscNombreAsc();

    @Query("""
            select trabajador
            from Trabajador trabajador
            where trabajador.activo = true
              and (trabajador.estadoDisponibilidad = :estado or trabajador.estadoDisponibilidad is null)
            order by trabajador.apellidos asc, trabajador.nombre asc
            """)
    List<Trabajador> findActivosDisponiblesOrderByApellidosAscNombreAsc(@Param("estado") EstadoDisponibilidadTrabajador estado);

    Optional<Trabajador> findByIdAndActivoTrue(Long id);

    Optional<Trabajador> findByEmailContactoIgnoreCase(String emailContacto);
}
