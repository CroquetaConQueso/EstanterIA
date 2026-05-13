package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.AlertaTrabajador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlertaTrabajadorRepository extends JpaRepository<AlertaTrabajador, Long> {

    boolean existsByAlertaIdAndTrabajadorId(Long alertaId, Long trabajadorId);

    @Query("""
            select distinct notificacion
            from AlertaTrabajador notificacion
            join fetch notificacion.alerta alerta
            left join fetch alerta.seccion
            left join fetch alerta.estanteria
            left join fetch alerta.slotConfiguracion slot
            left join fetch slot.producto
            left join fetch alerta.asignacionProductoSlot asignacion
            left join fetch asignacion.productoProveedor productoProveedor
            left join fetch productoProveedor.producto
            left join fetch productoProveedor.proveedor
            where notificacion.trabajador.id = :trabajadorId
            order by notificacion.notificadaAt desc
            """)
    List<AlertaTrabajador> findNotificacionesConContextoByTrabajador(@Param("trabajadorId") Long trabajadorId);

    @Query("""
            select notificacion
            from AlertaTrabajador notificacion
            join fetch notificacion.alerta alerta
            left join fetch alerta.seccion
            left join fetch alerta.estanteria
            left join fetch alerta.slotConfiguracion slot
            left join fetch slot.producto
            left join fetch alerta.asignacionProductoSlot asignacion
            left join fetch asignacion.productoProveedor productoProveedor
            left join fetch productoProveedor.producto
            left join fetch productoProveedor.proveedor
            where notificacion.id = :id
            """)
    Optional<AlertaTrabajador> findByIdConAlerta(@Param("id") Long id);
}
