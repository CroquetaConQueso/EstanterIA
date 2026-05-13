package com.proyectofincurso.estanteria.persistence.repository;

import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EstanteriaSlotConfiguracionRepository extends JpaRepository<EstanteriaSlotConfiguracion, Long> {
    @Query("""
            select slot
            from EstanteriaSlotConfiguracion slot
            join fetch slot.producto
            where slot.estanteria.id = :estanteriaId
              and slot.activo = true
            order by slot.orden asc
            """)
    List<EstanteriaSlotConfiguracion> findActivosByEstanteriaIdOrdenados(@Param("estanteriaId") Long estanteriaId);
}
