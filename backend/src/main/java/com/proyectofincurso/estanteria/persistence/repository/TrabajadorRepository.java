package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrabajadorRepository extends JpaRepository<Trabajador, Long> {
    List<Trabajador> findByEmpresaCodigoAndActivoTrueOrderByApellidosAscNombreAsc(String codigoEmpresa);

    List<Trabajador> findByActivoTrueOrderByApellidosAscNombreAsc();

    Optional<Trabajador> findByIdAndActivoTrue(Long id);

    Optional<Trabajador> findByEmailContactoIgnoreCase(String emailContacto);
}
