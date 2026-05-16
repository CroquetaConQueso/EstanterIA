package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoProveedorRepository extends JpaRepository<ProductoProveedor, Long> {
    @EntityGraph(attributePaths = {"producto", "proveedor"})
    List<ProductoProveedor> findByProductoIdAndActivoTrueOrderByProveedorNombreAsc(Long productoId);

    Optional<ProductoProveedor> findByProductoIdAndProveedorId(Long productoId, Long proveedorId);
}
