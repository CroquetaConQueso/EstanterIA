package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    @Query("""
            select count(alerta) > 0
            from Alerta alerta
            left join alerta.inspeccionSlotResultado slotResultado
            where alerta.inspeccion.id = :inspeccionId
               or slotResultado.inspeccion.id = :inspeccionId
            """)
    boolean existsByInspeccionIdOrSlotResultadoInspeccionId(@Param("inspeccionId") Long inspeccionId);

    @Query("""
            select distinct alerta
            from Alerta alerta
            left join fetch alerta.inspeccion
            left join fetch alerta.seccion
            left join fetch alerta.estanteria
            left join fetch alerta.slotConfiguracion slot
            left join fetch slot.producto
            left join fetch alerta.asignacionProductoSlot asignacion
            left join fetch asignacion.productoProveedor productoProveedor
            left join fetch productoProveedor.producto
            left join fetch productoProveedor.proveedor
            where alerta.estadoAlerta = :estado
            order by alerta.createdAt desc
            """)
    List<Alerta> findAlertasConContextoByEstado(@Param("estado") EstadoAlerta estado);

    @Query("""
            select distinct alerta
            from Alerta alerta
            left join fetch alerta.inspeccion
            left join fetch alerta.seccion
            left join fetch alerta.estanteria
            left join fetch alerta.slotConfiguracion slot
            left join fetch slot.producto
            left join fetch alerta.asignacionProductoSlot asignacion
            left join fetch asignacion.productoProveedor productoProveedor
            left join fetch productoProveedor.producto
            left join fetch productoProveedor.proveedor
            where alerta.estadoAlerta = :estado
              and alerta.seccion.id = :seccionId
            order by alerta.createdAt desc
            """)
    List<Alerta> findAlertasConContextoBySeccionAndEstado(@Param("seccionId") Long seccionId,
                                                          @Param("estado") EstadoAlerta estado);

    @Query("""
            select distinct alerta
            from Alerta alerta
            left join fetch alerta.inspeccion
            left join fetch alerta.estanteria
            left join fetch alerta.slotConfiguracion slot
            left join fetch slot.producto
            where alerta.estadoAlerta = :estado
              and alerta.estanteria.id in :estanteriaIds
            order by alerta.createdAt desc
            """)
    List<Alerta> findAlertasConContextoByEstanteriasAndEstado(@Param("estanteriaIds") Collection<Long> estanteriaIds,
                                                              @Param("estado") EstadoAlerta estado);

    @Query("""
            select alerta
            from Alerta alerta
            where alerta.estadoAlerta = :estado
              and alerta.tipoAlerta = :tipo
              and alerta.estanteria.id = :estanteriaId
              and alerta.slotConfiguracion.id = :slotConfiguracionId
            """)
    List<Alerta> findAlertasVisualesAbiertas(@Param("tipo") TipoAlerta tipo,
                                             @Param("estado") EstadoAlerta estado,
                                             @Param("estanteriaId") Long estanteriaId,
                                             @Param("slotConfiguracionId") Long slotConfiguracionId);

    @Query("""
            select alerta
            from Alerta alerta
            where alerta.estadoAlerta = :estado
              and alerta.tipoAlerta = :tipo
              and alerta.asignacionProductoSlot.id = :asignacionId
            """)
    List<Alerta> findAlertasAbiertasPorAsignacion(@Param("tipo") TipoAlerta tipo,
                                                  @Param("estado") EstadoAlerta estado,
                                                  @Param("asignacionId") Long asignacionId);

    @Query("""
            select alerta
            from Alerta alerta
            where alerta.estadoAlerta = :estado
              and alerta.tipoAlerta = :tipo
              and alerta.asignacionProductoSlot.id = :asignacionId
              and alerta.slotConfiguracion.id = :slotConfiguracionId
            """)
    List<Alerta> findAlertasAbiertasPorAsignacionYSlot(@Param("tipo") TipoAlerta tipo,
                                                       @Param("estado") EstadoAlerta estado,
                                                       @Param("asignacionId") Long asignacionId,
                                                       @Param("slotConfiguracionId") Long slotConfiguracionId);
}
