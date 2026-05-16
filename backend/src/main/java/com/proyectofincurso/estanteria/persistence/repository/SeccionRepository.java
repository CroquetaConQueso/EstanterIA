package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeccionRepository extends JpaRepository<Seccion, Long> {
    List<Seccion> findByEmpresaCodigoAndActivaTrueOrderByNombreAsc(String codigoEmpresa);

    List<Seccion> findByEmpresaCodigoOrderByNombreAsc(String codigoEmpresa);

    Optional<Seccion> findByIdAndActivaTrue(Long id);

    Optional<Seccion> findByEmpresaIdAndCodigoIgnoreCase(Long empresaId, String codigo);

    boolean existsByEmpresaIdAndCodigoIgnoreCase(Long empresaId, String codigo);

    boolean existsByEmpresaIdAndCodigoIgnoreCaseAndIdNot(Long empresaId, String codigo, Long id);
}
