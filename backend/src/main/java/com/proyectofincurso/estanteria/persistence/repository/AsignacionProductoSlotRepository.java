package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AsignacionProductoSlotRepository extends JpaRepository<AsignacionProductoSlot, Long> {
    @Query("""
            select asignacion
            from AsignacionProductoSlot asignacion
            join fetch asignacion.productoProveedor productoProveedor
            join fetch productoProveedor.proveedor
            join fetch productoProveedor.producto
            where asignacion.slotConfiguracion.id = :slotConfiguracionId
              and asignacion.estadoAsignacion = :estado
            """)
    Optional<AsignacionProductoSlot> findAsignacionActivaDeSlot(@Param("slotConfiguracionId") Long slotConfiguracionId,
                                                                @Param("estado") EstadoAsignacionProductoSlot estado);

    @Query("""
            select asignacion
            from AsignacionProductoSlot asignacion
            join fetch asignacion.slotConfiguracion slot
            join fetch asignacion.productoProveedor productoProveedor
            join fetch productoProveedor.proveedor
            join fetch productoProveedor.producto
            where slot.id in :slotConfiguracionIds
              and asignacion.estadoAsignacion = :estado
            """)
    List<AsignacionProductoSlot> findAsignacionesActivasDeSlots(@Param("slotConfiguracionIds") Collection<Long> slotConfiguracionIds,
                                                                @Param("estado") EstadoAsignacionProductoSlot estado);
}
