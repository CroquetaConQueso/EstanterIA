package com.proyectofincurso.estanteria.service;

import com.proyectofincurso.estanteria.persistence.entity.Alerta;
import com.proyectofincurso.estanteria.persistence.entity.AsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoAsignacionProductoSlot;
import com.proyectofincurso.estanteria.persistence.entity.EstadoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Estanteria;
import com.proyectofincurso.estanteria.persistence.entity.EstanteriaSlotConfiguracion;
import com.proyectofincurso.estanteria.persistence.entity.PrioridadAlerta;
import com.proyectofincurso.estanteria.persistence.entity.Producto;
import com.proyectofincurso.estanteria.persistence.entity.ProductoProveedor;
import com.proyectofincurso.estanteria.persistence.entity.Proveedor;
import com.proyectofincurso.estanteria.persistence.entity.Seccion;
import com.proyectofincurso.estanteria.persistence.entity.TareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.TipoAlerta;
import com.proyectofincurso.estanteria.persistence.entity.TipoTareaOperativa;
import com.proyectofincurso.estanteria.persistence.entity.Trabajador;
import com.proyectofincurso.estanteria.persistence.entity.UserAccount;
import com.proyectofincurso.estanteria.persistence.repository.TareaOperativaRepository;
import com.proyectofincurso.estanteria.persistence.repository.TrabajadorRepository;
import com.proyectofincurso.estanteria.persistence.repository.UserAccountRepository;
import com.proyectofincurso.estanteria.web.dto.AlertaAsignacionResponse;
import com.proyectofincurso.estanteria.web.dto.AlertaSlotResponse;
import com.proyectofincurso.estanteria.web.dto.EstanteriaResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProductoResumenResponse;
import com.proyectofincurso.estanteria.web.dto.ProveedorResumenResponse;
import com.proyectofincurso.estanteria.web.dto.SeccionResponse;
import com.proyectofincurso.estanteria.web.dto.TareaOperativaResponse;
import com.proyectofincurso.estanteria.web.dto.TrabajadorResumenResponse;
import com.proyectofincurso.estanteria.web.error.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TareaOperativaService {

    private final TareaOperativaRepository tareaOperativaRepository;
    private final TrabajadorRepository trabajadorRepository;
    private final UserAccountRepository userAccountRepository;

    @Transactional
    public void crearAutomaticaSiNoExiste(Alerta alerta) {
        TipoTareaOperativa tipoTarea = mapearTipoTarea(alerta.getTipoAlerta());
        if (tipoTarea == null || tareaOperativaRepository.existsByAlertaId(alerta.getId())) {
            return;
        }

        TareaOperativa tarea = new TareaOperativa();
        tarea.setAlerta(alerta);
        tarea.setTipoTarea(tipoTarea);
        tarea.setPrioridad(alerta.getPrioridad());
        tarea.setEstadoTarea(EstadoTareaOperativa.PENDIENTE);
        tarea.setTitulo(generarTitulo(alerta, tipoTarea));
        tarea.setDescripcion(generarDescripcion(alerta, tipoTarea));
        tarea.setSeccion(alerta.getSeccion());
        tarea.setEstanteria(alerta.getEstanteria());
        tarea.setSlotConfiguracion(alerta.getSlotConfiguracion());
        tarea.setAsignacionProductoSlot(alerta.getAsignacionProductoSlot());

        tareaOperativaRepository.save(tarea);
    }

    @Transactional(readOnly = true)
    public List<TareaOperativaResponse> obtenerTareas() {
        return tareaOperativaRepository.findAllConContexto().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TareaOperativaResponse> obtenerTareasPendientes() {
        return tareaOperativaRepository.findConContextoByEstadoIn(List.of(
                        EstadoTareaOperativa.PENDIENTE,
                        EstadoTareaOperativa.EN_PROGRESO
                )).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TareaOperativaResponse obtenerDetalle(Long id) {
        return tareaOperativaRepository.findByIdConContexto(id)
                .map(this::toResponse)
                .orElseThrow(() -> ApiException.notFound(
                        "TAREA_OPERATIVA_NOT_FOUND",
                        "No existe la tarea operativa indicada"
                ));
    }

    @Transactional
    public TareaOperativaResponse asignarTrabajador(Long id, Long trabajadorId) {
        TareaOperativa tarea = tareaOperativaRepository.findByIdConContexto(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TAREA_OPERATIVA_NOT_FOUND",
                        "No existe la tarea operativa indicada"
                ));
        Trabajador trabajador = trabajadorRepository.findById(trabajadorId)
                .orElseThrow(() -> ApiException.notFound(
                        "TRABAJADOR_NOT_FOUND",
                        "No existe el trabajador indicado"
                ));

        if (!Boolean.TRUE.equals(trabajador.getActivo())) {
            throw ApiException.badRequest(
                    "TRABAJADOR_INACTIVO",
                    "No se puede asignar una tarea a un trabajador inactivo"
            );
        }

        tarea.setTrabajadorAsignado(trabajador);
        tarea.setAssignedAt(Instant.now());
        resolverUsuarioAutenticado().ifPresent(tarea::setAsignadaPor);

        return toResponse(tarea);
    }

    @Transactional
    public TareaOperativaResponse cambiarEstado(Long id, EstadoTareaOperativa nuevoEstado) {
        TareaOperativa tarea = tareaOperativaRepository.findByIdConContexto(id)
                .orElseThrow(() -> ApiException.notFound(
                        "TAREA_OPERATIVA_NOT_FOUND",
                        "No existe la tarea operativa indicada"
                ));

        validarTransicion(tarea.getEstadoTarea(), nuevoEstado);
        tarea.setEstadoTarea(nuevoEstado);

        if (nuevoEstado == EstadoTareaOperativa.RESUELTA) {
            tarea.setResueltaAt(Instant.now());
        }

        return toResponse(tarea);
    }

    private java.util.Optional<UserAccount> resolverUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            return java.util.Optional.empty();
        }
        return userAccountRepository.findByUsernameIgnoreCase(authentication.getName());
    }

    private void validarTransicion(EstadoTareaOperativa actual, EstadoTareaOperativa nuevo) {
        if (actual == nuevo) {
            return;
        }

        boolean permitida = switch (actual) {
            case PENDIENTE -> nuevo == EstadoTareaOperativa.EN_PROGRESO
                    || nuevo == EstadoTareaOperativa.CANCELADA;
            case EN_PROGRESO -> nuevo == EstadoTareaOperativa.RESUELTA
                    || nuevo == EstadoTareaOperativa.CANCELADA;
            case RESUELTA, CANCELADA -> false;
        };

        if (!permitida) {
            throw ApiException.conflict(
                    "TRANSICION_TAREA_NO_PERMITIDA",
                    "El cambio de estado solicitado no esta permitido"
            );
        }
    }

    private TipoTareaOperativa mapearTipoTarea(TipoAlerta tipoAlerta) {
        return switch (tipoAlerta) {
            case HUECO_VACIO -> TipoTareaOperativa.REPOSICION;
            case ANOMALIA_VISUAL -> TipoTareaOperativa.REVISION_VISUAL;
            case REVISION_MANUAL -> TipoTareaOperativa.VERIFICACION_MANUAL;
            case PRODUCTO_PROXIMO_A_CADUCAR -> TipoTareaOperativa.REVISION_CADUCIDAD;
            case PRESENCIA_TRAS_RETIRADA_PROGRAMADA -> TipoTareaOperativa.RETIRADA_PRODUCTO;
            case RETIRADA_PROGRAMADA_PENDIENTE -> null;
        };
    }

    private String generarTitulo(Alerta alerta, TipoTareaOperativa tipoTarea) {
        String estanteria = codigoEstanteria(alerta);
        return switch (tipoTarea) {
            case REPOSICION -> "Reponer producto en estanteria " + estanteria;
            case REVISION_VISUAL -> "Revisar anomalia visual en estanteria " + estanteria;
            case VERIFICACION_MANUAL -> "Verificar inspeccion de baja confianza";
            case REVISION_CADUCIDAD -> "Revisar producto proximo a caducar";
            case RETIRADA_PRODUCTO -> "Comprobar retirada pendiente de producto";
        };
    }

    private String generarDescripcion(Alerta alerta, TipoTareaOperativa tipoTarea) {
        String slot = alerta.getSlotConfiguracion() != null
                ? alerta.getSlotConfiguracion().getSlotId()
                : "sin slot asociado";
        String estanteria = codigoEstanteria(alerta);
        return switch (tipoTarea) {
            case REPOSICION -> "Se ha detectado un hueco vacio en " + estanteria + ", " + slot
                    + ". Revisar y reponer el producto esperado si procede.";
            case REVISION_VISUAL -> "La inspeccion visual ha detectado una anomalia en " + estanteria + ", "
                    + slot + ". Revisar colocacion o producto presente.";
            case VERIFICACION_MANUAL -> "La clasificacion visual no ha alcanzado el umbral de confianza establecido. "
                    + "Se recomienda revision manual.";
            case REVISION_CADUCIDAD -> "Existe una asignacion activa cuya fecha de caducidad se aproxima al umbral definido.";
            case RETIRADA_PRODUCTO -> "Se ha detectado presencia en un slot cuya asignacion tenia retirada programada pendiente.";
        };
    }

    private String codigoEstanteria(Alerta alerta) {
        return alerta.getEstanteria() != null ? alerta.getEstanteria().getCodigo() : "sin estanteria";
    }

    private TareaOperativaResponse toResponse(TareaOperativa tarea) {
        UserAccount asignadaPor = tarea.getAsignadaPor();
        return new TareaOperativaResponse(
                tarea.getId(),
                tarea.getAlerta().getId(),
                tarea.getTipoTarea(),
                tarea.getPrioridad(),
                tarea.getEstadoTarea(),
                tarea.getTitulo(),
                tarea.getDescripcion(),
                toSeccionResponse(tarea.getSeccion()),
                toEstanteriaResumenResponse(tarea.getEstanteria()),
                toAlertaSlotResponse(tarea.getSlotConfiguracion()),
                toAlertaAsignacionResponse(tarea.getAsignacionProductoSlot()),
                toTrabajadorResumenResponse(tarea.getTrabajadorAsignado()),
                asignadaPor != null ? asignadaPor.getId() : null,
                asignadaPor != null ? asignadaPor.getUsername() : null,
                tarea.getCreatedAt(),
                tarea.getAssignedAt(),
                tarea.getFechaLimite(),
                tarea.getResueltaAt(),
                tarea.getUpdatedAt()
        );
    }

    private SeccionResponse toSeccionResponse(Seccion seccion) {
        if (seccion == null) {
            return null;
        }
        return new SeccionResponse(
                seccion.getId(),
                seccion.getCodigo(),
                seccion.getNombre(),
                seccion.getDescripcion(),
                seccion.getActiva()
        );
    }

    private EstanteriaResumenResponse toEstanteriaResumenResponse(Estanteria estanteria) {
        if (estanteria == null) {
            return null;
        }
        return new EstanteriaResumenResponse(
                estanteria.getId(),
                estanteria.getCodigo(),
                estanteria.getNombre(),
                estanteria.getDescripcion(),
                estanteria.getActiva()
        );
    }

    private AlertaSlotResponse toAlertaSlotResponse(EstanteriaSlotConfiguracion slot) {
        if (slot == null) {
            return null;
        }
        return new AlertaSlotResponse(
                slot.getId(),
                slot.getSlotId(),
                slot.getOrden(),
                toProductoResumenResponse(slot.getProducto())
        );
    }

    private AlertaAsignacionResponse toAlertaAsignacionResponse(AsignacionProductoSlot asignacion) {
        if (asignacion == null) {
            return null;
        }

        ProductoProveedor productoProveedor = asignacion.getProductoProveedor();
        return new AlertaAsignacionResponse(
                asignacion.getId(),
                productoProveedor != null ? toProductoResumenResponse(productoProveedor.getProducto()) : null,
                productoProveedor != null ? toProveedorResumenResponse(productoProveedor.getProveedor()) : null,
                productoProveedor != null ? productoProveedor.getClaveProductoProveedor() : null,
                asignacion.getFechaCaducidad(),
                asignacion.getFechaRetiradaProgramada(),
                asignacion.getEstadoAsignacion()
        );
    }

    private TrabajadorResumenResponse toTrabajadorResumenResponse(Trabajador trabajador) {
        if (trabajador == null) {
            return null;
        }
        return new TrabajadorResumenResponse(
                trabajador.getId(),
                trabajador.getNombre(),
                trabajador.getApellidos(),
                trabajador.getEmailContacto(),
                trabajador.getTipoTrabajador(),
                null
        );
    }

    private ProductoResumenResponse toProductoResumenResponse(Producto producto) {
        if (producto == null) {
            return null;
        }
        return new ProductoResumenResponse(
                producto.getId(),
                producto.getProductoUuid(),
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getDescripcion()
        );
    }

    private ProveedorResumenResponse toProveedorResumenResponse(Proveedor proveedor) {
        if (proveedor == null) {
            return null;
        }
        return new ProveedorResumenResponse(
                proveedor.getId(),
                proveedor.getCodigo(),
                proveedor.getNombre(),
                proveedor.getDescripcion()
        );
    }
}
