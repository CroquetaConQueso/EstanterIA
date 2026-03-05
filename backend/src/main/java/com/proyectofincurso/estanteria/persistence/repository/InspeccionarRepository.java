package com.proyectofincurso.estanteria.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;

import java.util.Optional;

public interface InspeccionarRepository extends JpaRepository<Inspeccion,Long>{
    //No es necesario establecer Optional<Inspeccion>findById(Long id); porque ya existe por defecto 
    Optional<Inspeccion>findByEstanteriaCodigo(String estanteriaCodigo);
    
    boolean existsByEstanteriaCodigoIgnoreCase(String estanteriaCodigo);
}
