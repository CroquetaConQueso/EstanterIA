package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.TareaOperativa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TareaOperativaRepository extends JpaRepository<TareaOperativa, Long> {

    boolean existsByAlertaId(Long alertaId);

    @Query("""
            select count(tarea) > 0
            from TareaOperativa tarea
            join tarea.alerta alerta
            left join alerta.inspeccionSlotResultado slotResultado
            where alerta.inspeccion.id = :inspeccionId
               or slotResultado.inspeccion.id = :inspeccionId
            """)
    boolean existsByAlertaDeInspeccionId(@Param("inspeccionId") Long inspeccionId);

    Optional<TareaOperativa> findByAlertaId(Long alertaId);

    @Query("""
            select distinct tarea
            from TareaOperativa tarea
            left join fetch tarea.alerta alerta
            left join fetch tarea.seccion
            left join fetch tarea.estanteria
            left join fetch tarea.slotConfiguracion slot
            left join fetch slot.producto
            left join fetch tarea.asignacionProductoSlot asignacion
            left join fetch asignacion.productoProveedor productoProveedor
            left join fetch productoProveedor.producto
            left join fetch productoProveedor.proveedor
            left join fetch tarea.trabajadorAsignado
            left join fetch tarea.asignadaPor
            order by tarea.createdAt desc
            """)
    List<TareaOperativa> findAllConContexto();

    @Query("""
            select distinct tarea
            from TareaOperativa tarea
            left join fetch tarea.alerta alerta
            left join fetch tarea.seccion
            left join fetch tarea.estanteria
            left join fetch tarea.slotConfiguracion slot
            left join fetch slot.producto
            left join fetch tarea.asignacionProductoSlot asignacion
            left join fetch asignacion.productoProveedor productoProveedor
            left join fetch productoProveedor.producto
            left join fetch productoProveedor.proveedor
            left join fetch tarea.trabajadorAsignado
            left join fetch tarea.asignadaPor
            where tarea.estadoTarea in :estados
            order by tarea.prioridad desc, tarea.createdAt desc
            """)
    List<TareaOperativa> findConContextoByEstadoIn(@Param("estados") Collection<EstadoTareaOperativa> estados);

    @Query("""
            select distinct tarea
            from TareaOperativa tarea
            left join fetch tarea.estanteria
            left join fetch tarea.slotConfiguracion slot
            left join fetch slot.producto
            where tarea.estadoTarea in :estados
              and tarea.estanteria.id in :estanteriaIds
            order by tarea.prioridad desc, tarea.createdAt desc
            """)
    List<TareaOperativa> findConContextoByEstanteriasAndEstadoIn(@Param("estanteriaIds") Collection<Long> estanteriaIds,
                                                                 @Param("estados") Collection<EstadoTareaOperativa> estados);

    @Query("""
            select distinct tarea
            from TareaOperativa tarea
            left join fetch tarea.alerta alerta
            left join fetch tarea.seccion
            left join fetch tarea.estanteria
            left join fetch tarea.slotConfiguracion slot
            left join fetch slot.producto
            left join fetch tarea.asignacionProductoSlot asignacion
            left join fetch asignacion.productoProveedor productoProveedor
            left join fetch productoProveedor.producto
            left join fetch productoProveedor.proveedor
            left join fetch tarea.trabajadorAsignado
            left join fetch tarea.asignadaPor
            where tarea.id = :id
            """)
    Optional<TareaOperativa> findByIdConContexto(@Param("id") Long id);

    @Query("""
            select distinct tarea
            from TareaOperativa tarea
            left join fetch tarea.estanteria
            left join fetch tarea.seccion
            where tarea.trabajadorAsignado.id = :trabajadorId
              and tarea.estadoTarea in :estados
            order by tarea.prioridad desc, tarea.createdAt desc
            """)
    List<TareaOperativa> findAsignadasByTrabajadorAndEstadoIn(@Param("trabajadorId") Long trabajadorId,
                                                              @Param("estados") Collection<EstadoTareaOperativa> estados);

    @Query("""
            select distinct alerta.id
            from TareaOperativa tarea
            join tarea.alerta alerta
            where alerta.id in :alertaIds
              and tarea.estadoTarea in :estados
              and tarea.trabajadorAsignado is not null
            """)
    List<Long> findAlertaIdsConTareasActivasAsignadas(@Param("alertaIds") Collection<Long> alertaIds,
                                                      @Param("estados") Collection<EstadoTareaOperativa> estados);
}
