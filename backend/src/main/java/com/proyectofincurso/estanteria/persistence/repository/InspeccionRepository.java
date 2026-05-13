package com.proyectofincurso.estanteria.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyectofincurso.estanteria.persistence.entity.Inspeccion;

public interface InspeccionRepository extends JpaRepository<Inspeccion,Long>{
    //No es necesario establecer Optional<Inspeccion>findById(Long id); porque ya existe por defecto 
}
