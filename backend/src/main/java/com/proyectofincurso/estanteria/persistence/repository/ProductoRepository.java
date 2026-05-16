package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findByCodigoInternoAndActivoTrue(String codigoInterno);

    Optional<Producto> findByCodigoInternoIgnoreCase(String codigoInterno);

    boolean existsByCodigoInternoIgnoreCase(String codigoInterno);

    List<Producto> findByActivoTrueOrderByNombreAsc();
}
