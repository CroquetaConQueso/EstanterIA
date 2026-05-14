package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrabajadorRepository extends JpaRepository<Trabajador, Long> {
    List<Trabajador> findByEmpresaCodigoAndActivoTrueOrderByApellidosAscNombreAsc(String codigoEmpresa);

    List<Trabajador> findByActivoTrueOrderByApellidosAscNombreAsc();
}
