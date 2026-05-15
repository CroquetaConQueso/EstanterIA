package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeccionRepository extends JpaRepository<Seccion, Long> {
    List<Seccion> findByEmpresaCodigoAndActivaTrueOrderByNombreAsc(String codigoEmpresa);

    Optional<Seccion> findByIdAndActivaTrue(Long id);

    boolean existsByEmpresaIdAndCodigoIgnoreCase(Long empresaId, String codigo);
}
