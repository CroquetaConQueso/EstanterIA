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
}
